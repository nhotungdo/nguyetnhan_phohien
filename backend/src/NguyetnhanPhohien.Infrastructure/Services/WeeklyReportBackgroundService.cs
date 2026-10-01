using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

/// <summary>
/// Dịch vụ nền gửi email báo cáo doanh thu tuần cho chủ cửa hàng.
///
/// - Lịch gửi: cấu hình qua appsettings "WeeklyReport" (mặc định Thứ Hai 08:00 giờ Việt Nam).
/// - Kỳ báo cáo: 7 ngày trước thời điểm gửi (Thứ Hai → Chủ Nhật của tuần trước).
/// - Dữ liệu: đơn hàng tạo trong kỳ, tính hoàn toàn phía server (chỉ đơn Đã giao mới tính doanh thu).
/// - Bật "SendOnStartup": true một lần để gửi thử ngay khi khởi động, sau đó đặt lại false.
/// </summary>
public class WeeklyReportBackgroundService : BackgroundService
{
    private static readonly TimeZoneInfo VnTimeZone = ResolveVnTimeZone();

    private static readonly Dictionary<OrderStatus, string> StatusLabels = new()
    {
        [OrderStatus.PendingConfirmation] = "Chờ xác nhận",
        [OrderStatus.Confirmed] = "Đã xác nhận",
        [OrderStatus.Shipping] = "Đang giao",
        [OrderStatus.Completed] = "Đã giao",
        [OrderStatus.Cancelled] = "Đã huỷ",
    };

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<WeeklyReportBackgroundService> _logger;

    public WeeklyReportBackgroundService(
        IServiceScopeFactory scopeFactory,
        IEmailService emailService,
        IConfiguration config,
        ILogger<WeeklyReportBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _emailService = emailService;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!GetConfigBool("WeeklyReport:Enabled", true))
        {
            _logger.LogInformation("WeeklyReport đang tắt (WeeklyReport:Enabled = false).");
            return;
        }

        if (GetConfigBool("WeeklyReport:SendOnStartup", false))
        {
            _logger.LogInformation("WeeklyReport:SendOnStartup = true — gửi thử báo cáo ngay khi khởi động.");
            await TrySendReportAsync(stoppingToken);
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            var delay = GetDelayUntilNextSend();
            _logger.LogInformation("Báo cáo doanh thu tuần: lần gửi tiếp theo sau {Delay:dd\\.hh\\:mm\\:ss}.", delay);

            await Task.Delay(delay, stoppingToken);

            await TrySendReportAsync(stoppingToken);
        }
    }

    private async Task TrySendReportAsync(CancellationToken ct)
    {
        try
        {
            await SendReportAsync(ct);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // App đang tắt — không coi là lỗi.
        }
        catch (Exception ex)
        {
            // Lỗi gửi email / lỗi DB không được làm crash app — tuần sau sẽ gửi lại.
            _logger.LogError(ex, "Gửi báo cáo doanh thu tuần thất bại.");
        }
    }

    // ===== LẤY DỮ LIỆU & GỬI EMAIL =====
    private async Task SendReportAsync(CancellationToken ct)
    {
        var recipient = _config["WeeklyReport:RecipientEmail"];
        if (string.IsNullOrWhiteSpace(recipient))
        {
            _logger.LogWarning("WeeklyReport:RecipientEmail chưa cấu hình — bỏ qua gửi báo cáo tuần.");
            return;
        }

        // Kỳ báo cáo: 7 ngày trôi qua trước thời điểm gửi, theo múi giờ Việt Nam.
        var nowVn = TimeZoneInfo.ConvertTime(DateTime.UtcNow, VnTimeZone);
        var periodEndVn = nowVn.Date;
        var periodStartVn = periodEndVn.AddDays(-7);
        var startUtc = TimeZoneInfo.ConvertTimeToUtc(periodStartVn, VnTimeZone);
        var endUtc = TimeZoneInfo.ConvertTimeToUtc(periodEndVn, VnTimeZone);

        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var orders = await db.Orders
            .Include(o => o.Items)
            .Where(o => o.CreatedAt >= startUtc && o.CreatedAt < endUtc)
            .ToListAsync(ct);

        var completedOrders = orders.Where(o => o.Status == OrderStatus.Completed).ToList();
        var revenue = completedOrders.Sum(o => o.TotalAmount);
        var avgOrderValue = completedOrders.Count > 0 ? Math.Round(revenue / completedOrders.Count) : 0m;

        // Doanh thu theo ngày (7 ngày, Thứ Hai → Chủ Nhật)
        var byDay = new List<(string DayLabel, int Orders, decimal Revenue)>();
        for (var i = 0; i < 7; i++)
        {
            var day = periodStartVn.AddDays(i);
            var dayStartUtc = TimeZoneInfo.ConvertTimeToUtc(day, VnTimeZone);
            var dayEndUtc = TimeZoneInfo.ConvertTimeToUtc(day.AddDays(1), VnTimeZone);
            var dayOrders = orders.Where(o => o.CreatedAt >= dayStartUtc && o.CreatedAt < dayEndUtc).ToList();

            byDay.Add((
                day.ToString("dd/MM"),
                dayOrders.Count,
                dayOrders.Where(o => o.Status == OrderStatus.Completed).Sum(o => o.TotalAmount)));
        }

        // Top 5 sản phẩm bán chạy: gom items đơn mới + fallback đơn legacy 1 sản phẩm
        var productAgg = new Dictionary<string, (string Name, string Size, int Quantity, decimal Revenue)>();
        foreach (var order in orders)
        {
            if (order.Items.Count > 0)
            {
                foreach (var item in order.Items)
                {
                    var key = item.ProductId.ToString();
                    var (name, size, qty, rev) = productAgg.TryGetValue(key, out var cur)
                        ? cur
                        : (item.ProductName, item.ProductSize ?? "", 0, 0m);
                    productAgg[key] = (name, size, qty + item.Quantity, rev + item.TotalPrice);
                }
            }
            else if (!string.IsNullOrWhiteSpace(order.ProductName))
            {
                var key = "legacy-" + order.ProductName + "|" + (order.ProductSize ?? "");
                var (name, size, qty, rev) = productAgg.TryGetValue(key, out var cur)
                    ? cur
                    : (order.ProductName, order.ProductSize ?? "", 0, 0m);
                productAgg[key] = (name, size, qty + order.Quantity, rev + order.BaseAmount);
            }
        }

        var topProducts = productAgg.Values
            .OrderByDescending(p => p.Quantity)
            .ThenByDescending(p => p.Revenue)
            .Take(5)
            .ToList();

        var statusSummary = string.Join(" · ", StatusLabels.Select(kv => $"{kv.Value}: {orders.Count(o => o.Status == kv.Key)}"));

        var subject = $"[Báo cáo tuần {periodStartVn:dd/MM} - {periodEndVn.AddDays(-1):dd/MM}] " +
                      $"Doanh thu {revenue:N0}đ - Nguyệt Nhãn Phố Hiến";
        var html = BuildReportHtml(periodStartVn, periodEndVn.AddDays(-1),
            orders.Count, revenue, completedOrders.Count, avgOrderValue,
            statusSummary, byDay, topProducts);

        await _emailService.SendEmailAsync(recipient, subject, html);

        _logger.LogInformation("Đã gửi báo cáo doanh thu tuần tới {Recipient}: {Orders} đơn, doanh thu {Revenue:N0}đ.",
            recipient, orders.Count, revenue);
    }

    // ===== HTML EMAIL (cùng phong cách với hóa đơn trong OrderService) =====
    private static string BuildReportHtml(
        DateTime start, DateTime end,
        int totalOrders, decimal revenue, int completedCount, decimal avgOrderValue,
        string statusSummary,
        List<(string DayLabel, int Orders, decimal Revenue)> byDay,
        List<(string Name, string Size, int Quantity, decimal Revenue)> topProducts)
    {
        string Esc(string? s) => WebUtility.HtmlEncode(s ?? "");

        var dayRows = string.Join("", byDay.Select(d => $@"
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{d.DayLabel}</td>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{d.Orders}</td>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>{d.Revenue:N0} đ</td>
                        </tr>"));

        var productRows = topProducts.Count == 0
            ? @"
                        <tr>
                            <td colspan='5' style='padding: 8px; border: 1px solid #ddd; text-align: center; font-style: italic;'>
                                Tuần này chưa có sản phẩm nào được bán.
                            </td>
                        </tr>"
            : string.Join("", topProducts.Select((p, i) => $@"
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{i + 1}</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{Esc(p.Name)} {(string.IsNullOrWhiteSpace(p.Size) ? "" : $"({Esc(p.Size)})")}</td>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{p.Quantity}</td>
                            <td style='padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;'>{p.Revenue:N0} đ</td>
                        </tr>"));

        return $@"
                <div style='font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #2E7D32; text-align: center;'>BÁO CÁO DOANH THU TUẦN</h2>
                    <p style='text-align: center; margin-top: 0;'>Nguyệt Nhãn Phố Hiến — Kỳ <strong>{start:dd/MM/yyyy}</strong> → <strong>{end:dd/MM/yyyy}</strong></p>

                    <table style='width: 100%; margin-top: 15px; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 6px;'><strong>Tổng đơn hàng:</strong></td>
                            <td style='padding: 6px; text-align: right;'>{totalOrders}</td>
                        </tr>
                        <tr>
                            <td style='padding: 6px;'><strong>Đơn đã giao:</strong></td>
                            <td style='padding: 6px; text-align: right;'>{completedCount}</td>
                        </tr>
                        <tr>
                            <td style='padding: 6px;'><strong>Doanh thu (đơn đã giao):</strong></td>
                            <td style='padding: 6px; text-align: right; font-size: 18px; font-weight: bold; color: #2E7D32;'>{revenue:N0} đ</td>
                        </tr>
                        <tr>
                            <td style='padding: 6px;'><strong>Giá trị TB mỗi đơn:</strong></td>
                            <td style='padding: 6px; text-align: right;'>{avgOrderValue:N0} đ</td>
                        </tr>
                    </table>

                    <p style='margin-top: 10px; color: #666; font-size: 13px;'>{Esc(statusSummary)}</p>

                    <h4 style='margin-top: 20px; color: #2E7D32;'>Doanh thu theo ngày</h4>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <thead>
                            <tr style='background-color: #f2f2f2;'>
                                <th style='padding: 8px; border: 1px solid #ddd;'>Ngày</th>
                                <th style='padding: 8px; border: 1px solid #ddd;'>Số đơn</th>
                                <th style='padding: 8px; border: 1px solid #ddd;'>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>{dayRows}</tbody>
                    </table>

                    <h4 style='margin-top: 20px; color: #2E7D32;'>Top sản phẩm bán chạy</h4>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <thead>
                            <tr style='background-color: #f2f2f2;'>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 40px;'>#</th>
                                <th style='padding: 8px; border: 1px solid #ddd;'>Sản phẩm</th>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 60px;'>SL</th>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 120px;'>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>{productRows}</tbody>
                    </table>

                    <p style='margin-top: 25px; text-align: center;'>
                        <a href='http://localhost:3000/dashboard' style='color: #2E7D32;'>Xem chi tiết trên Dashboard</a>
                    </p>
                    <p style='text-align: center; color: #999; font-size: 12px; margin-top: 20px;'>
                        Email tự động từ hệ thống Nguyệt Nhãn Phố Hiến
                    </p>
                </div>";
    }

    // ===== LỊCH GỬI & CẤU HÌNH =====
    private TimeSpan GetDelayUntilNextSend()
    {
        var sendDay = Enum.TryParse<DayOfWeek>(_config["WeeklyReport:SendOnDay"], true, out var d)
            ? d
            : DayOfWeek.Monday;
        var sendHour = int.TryParse(_config["WeeklyReport:SendHour"], out var h) && h is >= 0 and <= 23
            ? h
            : 8;

        var nowVn = TimeZoneInfo.ConvertTime(DateTime.UtcNow, VnTimeZone);
        var daysUntil = ((int)sendDay - (int)nowVn.DayOfWeek + 7) % 7;
        var next = nowVn.Date.AddDays(daysUntil).AddHours(sendHour);
        if (next <= nowVn) next = next.AddDays(7);

        var nextUtc = TimeZoneInfo.ConvertTimeToUtc(next, VnTimeZone);
        return nextUtc - DateTime.UtcNow;
    }

    private bool GetConfigBool(string key, bool fallback)
        => bool.TryParse(_config[key], out var value) ? value : fallback;

    /// <summary>
    /// Múi giờ Việt Nam: Windows dùng "SE Asia Standard Time", Linux dùng "Asia/Ho_Chi_Minh".
    /// Nếu không tìm thấy thì fallback về UTC (lịch gửi có thể lệch múi giờ nhưng vẫn chạy).
    /// </summary>
    private static TimeZoneInfo ResolveVnTimeZone()
    {
        foreach (var id in new[] { "SE Asia Standard Time", "Asia/Ho_Chi_Minh" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return TimeZoneInfo.Utc;
    }
}
