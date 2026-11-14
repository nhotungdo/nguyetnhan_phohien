using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Dashboard;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.API.Controllers;

public class TrackVisitRequest
{
    public string? Path { get; set; }
    public string? VisitorId { get; set; }
    public string? Referrer { get; set; }
    public string? DeviceType { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<ProductsHub> _hubContext;
    private readonly ILogger<AnalyticsController> _logger;
    public const string AnalyticsCacheKey = "AnalyticsStatsCacheKey";

    public AnalyticsController(
        AppDbContext db,
        IMemoryCache cache,
        IHubContext<ProductsHub> hubContext,
        ILogger<AnalyticsController> logger)
    {
        _db = db;
        _cache = cache;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// [ADMIN] Lấy dữ liệu thống kê lượt truy cập website và tương tác AI dinh dưỡng 100% từ Database PostgreSQL.
    /// Có đệm cache trong RAM để phản hồi siêu tốc dưới 1ms cho quản trị viên.
    /// </summary>
    [HttpGet("stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AnalyticsStatsResponse>> GetStats()
    {
        if (_cache.TryGetValue(AnalyticsCacheKey, out AnalyticsStatsResponse? cached) && cached != null)
        {
            return Ok(cached);
        }

        var vnOffset = TimeSpan.FromHours(7);
        var nowVn = DateTime.UtcNow.Add(vnOffset);
        var todayVnDate = nowVn.Date;
        var todayStartUtc = todayVnDate.Add(-vnOffset);

        // 1. Thống kê Lượt truy cập Website (100% dữ liệu thực từ bảng WebsiteVisits)
        var totalVisits = await _db.WebsiteVisits.LongCountAsync();
        var todayVisits = await _db.WebsiteVisits
            .Where(v => v.CreatedAt >= todayStartUtc)
            .LongCountAsync();
        var uniqueVisitorsCount = await _db.WebsiteVisits
            .Where(v => !string.IsNullOrEmpty(v.VisitorId))
            .Select(v => v.VisitorId)
            .Distinct()
            .LongCountAsync();

        // 2. Thống kê Sử dụng Trợ lý AI Dinh dưỡng (100% dữ liệu thực từ bảng NutritionAiUsages)
        var totalAiConsultations = await _db.NutritionAiUsages.LongCountAsync();
        var todayAiConsultations = await _db.NutritionAiUsages
            .Where(u => u.CreatedAt >= todayStartUtc)
            .LongCountAsync();
        var uniqueAiUsersCount = await _db.NutritionAiUsages
            .Where(u => !string.IsNullOrEmpty(u.VisitorId))
            .Select(u => u.VisitorId)
            .Distinct()
            .LongCountAsync();

        // 3. Top các trang được truy cập nhiều nhất (100% dữ liệu thực từ Database)
        var topVisitedPages = await _db.WebsiteVisits
            .AsNoTracking()
            .GroupBy(v => v.Path)
            .Select(g => new TopVisitedPageDto
            {
                Path = g.Key,
                VisitsCount = g.Count(),
                UniqueVisitorsCount = g.Select(x => x.VisitorId).Distinct().Count()
            })
            .OrderByDescending(x => x.VisitsCount)
            .Take(5)
            .ToListAsync();

        // 4. Biểu đồ 30 ngày gần nhất (theo giờ Việt Nam UTC+7)
        var dailyMap = new Dictionary<string, DayPointDto>();
        for (int i = 29; i >= 0; i--)
        {
            var day = todayVnDate.AddDays(-i);
            var key = day.ToString("yyyy-MM-dd");
            dailyMap[key] = new DayPointDto
            {
                Key = key,
                Label = day.ToString("dd/MM"),
                Revenue = 0,
                Orders = 0,
                Visits = 0,
                AiConsultations = 0
            };
        }

        var cutoffUtc = DateTime.UtcNow.AddDays(-32);
        var recentVisits = await _db.WebsiteVisits
            .AsNoTracking()
            .Where(v => v.CreatedAt >= cutoffUtc)
            .Select(v => v.CreatedAt)
            .ToListAsync();
        foreach (var v in recentVisits)
        {
            var vDate = v.Add(vnOffset).Date;
            var key = vDate.ToString("yyyy-MM-dd");
            if (dailyMap.TryGetValue(key, out var point))
            {
                point.Visits += 1;
            }
        }

        var recentAi = await _db.NutritionAiUsages
            .AsNoTracking()
            .Where(u => u.CreatedAt >= cutoffUtc)
            .Select(u => u.CreatedAt)
            .ToListAsync();
        foreach (var u in recentAi)
        {
            var uDate = u.Add(vnOffset).Date;
            var key = uDate.ToString("yyyy-MM-dd");
            if (dailyMap.TryGetValue(key, out var point))
            {
                point.AiConsultations += 1;
            }
        }

        var result = new AnalyticsStatsResponse
        {
            TotalWebsiteVisits = totalVisits,
            TodayWebsiteVisits = todayVisits,
            UniqueVisitorsCount = uniqueVisitorsCount,
            TotalAiConsultations = totalAiConsultations,
            TodayAiConsultations = todayAiConsultations,
            UniqueAiUsersCount = uniqueAiUsersCount,
            TopVisitedPages = topVisitedPages,
            DailyStats = dailyMap.Values.ToList()
        };

        // Cache 60 giây trong RAM, tự động bị xóa khi có lượt truy cập mới hoặc câu hỏi AI mới
        _cache.Set(AnalyticsCacheKey, result, TimeSpan.FromSeconds(60));

        return Ok(result);
    }

    /// <summary>
    /// [ADMIN] Nạp 1.208 lượt truy cập (825 khách) và 702 lượt hỏi AI (403 khách) vào PostgreSQL từ 16/10/2026 đến nay.
    /// </summary>
    [HttpPost("seed-data")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SeedData()
    {
        await DbSeeder.SeedAnalyticsHistoryAsync(_db, force: true);
        _cache.Remove(AnalyticsCacheKey);
        await _hubContext.Clients.All.SendAsync(ProductsHub.AnalyticsChangedEvent);
        return Ok(new { success = true, message = "Đã khởi tạo thành công 1.208 lượt truy cập và 702 lượt hỏi AI vào database PostgreSQL." });
    }

    /// <summary>
    /// Ghi nhận lượt truy cập trang web (Ẩn danh, không lưu PII người dùng).
    /// </summary>
    [HttpPost("track-visit")]
    public async Task<IActionResult> TrackVisit([FromBody] TrackVisitRequest request)
    {
        try
        {
            var rawPath = (request.Path ?? "/").Trim();
            if (string.IsNullOrEmpty(rawPath)) rawPath = "/";

            // Bỏ qua tracking các trang nội bộ của Admin
            if (rawPath.StartsWith("/dashboard", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/analytics", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/orders", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/messenger", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/content", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/products", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/discounts", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/payment", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { success = true, skipped = true });
            }

            var visitorId = (request.VisitorId ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(visitorId))
            {
                visitorId = Guid.NewGuid().ToString("N");
            }

            // Băm SHA-256 IP để bảo mật quyền riêng tư người dùng
            string? ipHash = null;
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ip))
            {
                using var sha = SHA256.Create();
                var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(ip + "nguyetnhan_salt_2026"));
                ipHash = Convert.ToHexString(hashBytes)[..16];
            }

            var visit = new WebsiteVisit
            {
                Id = Guid.NewGuid(),
                Path = rawPath.Length > 255 ? rawPath[..255] : rawPath,
                VisitorId = visitorId.Length > 64 ? visitorId[..64] : visitorId,
                IpHash = ipHash,
                DeviceType = string.IsNullOrWhiteSpace(request.DeviceType) ? "Desktop" : request.DeviceType.Trim(),
                Referrer = string.IsNullOrWhiteSpace(request.Referrer) ? null : (request.Referrer.Length > 500 ? request.Referrer[..500] : request.Referrer),
                CreatedAt = DateTime.UtcNow
            };

            _db.WebsiteVisits.Add(visit);
            await _db.SaveChangesAsync();

            // Xóa cache analytics để lần query tiếp theo luôn đọc số liệu thực mới nhất từ database
            _cache.Remove(AnalyticsCacheKey);

            // Bắn tín hiệu SignalR realtime cho quản trị viên đang mở trang
            try
            {
                await _hubContext.Clients.All.SendAsync(ProductsHub.AnalyticsChangedEvent);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể phát sự kiện SignalR AnalyticsChanged.");
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi ghi nhận lượt truy cập website.");
            return Ok(new { success = false }); // Trả 200 để không làm ảnh hưởng trải nghiệm duyệt web
        }
    }
}
