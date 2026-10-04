using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.DTOs.Orders;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderService> _logger;
    private readonly string _frontendBaseUrl;

    public OrderService(AppDbContext db, IEmailService emailService, ILogger<OrderService> logger, IConfiguration config)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
        // Domain frontend để gắn vào link trong email — hardcode "localhost:3000"
        // trước đây tạo link chết khi deploy. Cấu hình qua Frontend:BaseUrl.
        _frontendBaseUrl = (config["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
    }

    public async Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request)
    {
        // ===== 1. CHUẨN HÓA VÀ VALIDATE DANH SÁCH SẢN PHẨM =====
        var requestedItems = new List<(Guid ProductId, int Quantity)>();

        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (!Guid.TryParse(item.ProductId, out var pId))
                    throw new ArgumentException("ID sản phẩm không hợp lệ.");
                if (item.Quantity < 1 || item.Quantity > 999)
                    throw new ArgumentException("Số lượng phải từ 1 đến 999.");

                requestedItems.Add((pId, item.Quantity));
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.ProductId) && Guid.TryParse(request.ProductId, out var legacyId))
        {
            var qty = request.Quantity ?? 1;
            if (qty < 1 || qty > 999)
                throw new ArgumentException("Số lượng phải từ 1 đến 999.");

            requestedItems.Add((legacyId, qty));
        }

        if (requestedItems.Count == 0)
            throw new ArgumentException("Vui lòng chọn ít nhất 1 sản phẩm.");

        // Gom nhóm sản phẩm nếu client gửi trùng ProductId
        var groupedItems = requestedItems
            .GroupBy(i => i.ProductId)
            .Select(g => (ProductId: g.Key, Quantity: g.Sum(i => i.Quantity)))
            .ToList();

        var productIds = groupedItems.Select(g => g.ProductId).ToList();

        // Lấy thông tin sản phẩm từ DB (chỉ tin giá từ DB)
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
            throw new ArgumentException("Có sản phẩm không tồn tại hoặc đã ngừng bán.");

        // Tạo danh sách OrderItem và tính BaseAmount
        var orderItems = new List<OrderItem>();
        decimal baseAmount = 0;

        foreach (var item in groupedItems)
        {
            var product = products[item.ProductId];
            var totalPrice = product.Price * item.Quantity;
            baseAmount += totalPrice;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ProductSize = product.Size,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                TotalPrice = totalPrice
            });
        }

        // ===== 2. VALIDATE MÃ GIẢM GIÁ VÀ TÍNH SỐ TIỀN GIẢM =====
        decimal discountAmount = 0;
        DiscountCode? appliedDiscount = null;

        if (!string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            // Không phân biệt hoa/thường — khách gõ "welcome10" vẫn khớp mã "WELCOME10"
            var code = request.DiscountCode.Trim().ToUpperInvariant();
            var discountCode = await _db.DiscountCodes
                .FirstOrDefaultAsync(d => d.Code.ToUpper() == code && d.IsActive && !d.IsAdminBackdoor)
                ?? throw new ArgumentException("Mã giảm giá không hợp lệ.");

            if (discountCode.ExpiresAt.HasValue && discountCode.ExpiresAt.Value < DateTime.UtcNow)
                throw new ArgumentException("Mã giảm giá đã hết hạn.");

            if (discountCode.MaxUsageCount.HasValue && discountCode.UsageCount >= discountCode.MaxUsageCount.Value)
                throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");

            if (discountCode.PercentOff.HasValue)
            {
                if (discountCode.PercentOff.Value <= 0 || discountCode.PercentOff.Value > 100)
                    throw new ArgumentException("Mã giảm giá không hợp lệ.");
                discountAmount = decimal.Round(baseAmount * discountCode.PercentOff.Value / 100m, 0, MidpointRounding.AwayFromZero);
            }
            else if (discountCode.AmountOff.HasValue)
            {
                if (discountCode.AmountOff.Value <= 0)
                    throw new ArgumentException("Mã giảm giá không hợp lệ.");
                discountAmount = Math.Min(discountCode.AmountOff.Value, baseAmount);
            }
            else
            {
                throw new ArgumentException("Mã giảm giá không hợp lệ.");
            }

            appliedDiscount = discountCode;
        }

        // ===== 3. TẠO ĐƠN HÀNG =====
        var firstItem = orderItems.First();
        var order = new Order
        {
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            CustomerAddress = request.CustomerAddress,
            Note = request.Note,
            // Dynamic multi-items
            Items = orderItems,
            // Legacy single-item fallback (lấy món đầu tiên)
            ProductId = firstItem.ProductId,
            ProductName = firstItem.ProductName,
            ProductSize = firstItem.ProductSize,
            Quantity = firstItem.Quantity,

            BaseAmount = baseAmount,
            TotalAmount = Math.Max(0, baseAmount - discountAmount),
            DiscountAmount = discountAmount,
            DiscountCodeApplied = appliedDiscount?.Code,
            Status = OrderStatus.PendingConfirmation,
            CreatedAt = DateTime.UtcNow
        };

        // ===== 4. TĂNG LƯỢT DÙNG MÃ + LƯU ĐƠN TRONG MỘT TRANSACTION =====
        // ExecuteUpdateAsync ghi xuống DB ngay lập tức, tách khỏi transaction
        // riêng của SaveChangesAsync. Nếu lưu đơn thất bại sau khi đã tăng
        // UsageCount, lượt mã sẽ bị "đốt" oan cho một đơn không tồn tại.
        // Bọc cả hai trong một transaction: lỗi ở bước nào cũng rollback toàn bộ.
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (appliedDiscount != null)
            {
                // UPDATE có điều kiện (UsageCount < MaxUsageCount) giữ nguyên tính
                // nguyên tử chống race condition: nhiều request tranh chấp cùng lúc
                // thì chỉ một request thắng, những request kia nhận affected == 0.
                var affected = await _db.DiscountCodes
                    .Where(d => d.Id == appliedDiscount.Id
                        && (!d.MaxUsageCount.HasValue || d.UsageCount < d.MaxUsageCount.Value))
                    .ExecuteUpdateAsync(s => s.SetProperty(d => d.UsageCount, d => d.UsageCount + 1));

                if (affected == 0)
                    throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");
            }

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Gửi email bất đồng bộ (fire-and-forget): EmailService tự retry 3 lần với backoff;
        // nếu vẫn fail thì lỗi được ghi log ERROR kèm OrderId để tra cứu và gửi thủ công.
        _ = Task.Run(() => SendOrderEmailsAsync(order));

        return MapToResponse(order);
    }

    private async Task SendOrderEmailsAsync(Order order)
    {
        try
        {
            string adminEmail = "nhotungdo89@gmail.com";

            // Render HTML bảng danh sách các mặt hàng
            var itemsHtmlRows = string.Join("", order.Items.Select((item, idx) => $@"
                <tr>
                    <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{idx + 1}</td>
                    <td style='padding: 8px; border: 1px solid #ddd;'>{item.ProductName} {(string.IsNullOrWhiteSpace(item.ProductSize) ? "" : $"({item.ProductSize})")}</td>
                    <td style='padding: 8px; border: 1px solid #ddd; text-align: right;'>{item.UnitPrice:N0} đ</td>
                    <td style='padding: 8px; border: 1px solid #ddd; text-align: center;'>{item.Quantity}</td>
                    <td style='padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;'>{item.TotalPrice:N0} đ</td>
                </tr>"));

            string invoiceHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #4CAF50; text-align: center;'>Hóa đơn mua hàng - Nguyệt Nhãn Phố Hiến</h2>
                    <p>Xin chào <strong>{order.CustomerName}</strong>,</p>
                    <p>Cảm ơn bạn đã đặt hàng tại Nguyệt Nhãn Phố Hiến. Dưới đây là thông tin đơn hàng của bạn:</p>
                    
                    <p style='margin-top: 15px;'><strong>Mã đơn hàng:</strong> {order.Id}</p>
                    <p><strong>Điện thoại:</strong> {order.CustomerPhone}</p>
                    <p><strong>Địa chỉ nhận:</strong> {order.CustomerAddress}</p>
                    <p><strong>Ghi chú:</strong> {order.Note ?? "Không"}</p>

                    <h4 style='margin-top: 20px; color: #2E7D32;'>Danh sách sản phẩm</h4>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <thead>
                            <tr style='background-color: #f2f2f2;'>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 40px;'>STT</th>
                                <th style='padding: 8px; border: 1px solid #ddd;'>Sản phẩm</th>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 100px;'>Đơn giá</th>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 60px;'>SL</th>
                                <th style='padding: 8px; border: 1px solid #ddd; width: 110px;'>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsHtmlRows}
                        </tbody>
                    </table>

                    <table style='width: 100%; margin-top: 15px; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 6px; text-align: right;'><strong>Tổng tiền hàng:</strong></td>
                            <td style='padding: 6px; text-align: right; width: 130px;'>{order.BaseAmount:N0} đ</td>
                        </tr>
                        {(order.DiscountAmount > 0 ? $@"
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #E53935;'><strong>Giảm giá ({order.DiscountCodeApplied}):</strong></td>
                            <td style='padding: 6px; text-align: right; color: #E53935;'>- {order.DiscountAmount:N0} đ</td>
                        </tr>" : "")}
                        <tr>
                            <td style='padding: 8px; text-align: right; font-size: 16px;'><strong>Tổng thanh toán:</strong></td>
                            <td style='padding: 8px; text-align: right; font-size: 16px; font-weight: bold; color: #2E7D32;'>{order.TotalAmount:N0} đ</td>
                        </tr>
                    </table>

                    <p style='margin-top: 25px;'>Chúng tôi sẽ sớm liên hệ với bạn để xác nhận và giao hàng.</p>
                    <p>Trân trọng,<br/><strong>Nguyệt Nhãn Phố Hiến</strong></p>
                </div>";

            // Gửi cho khách và admin TÁCH RIÊNG: một bên fail không chặn bên còn lại.
            // EmailService đã tự retry 3 lần — tới đây vẫn fail thì log ERROR để gửi thủ công.
            if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                try
                {
                    await _emailService.SendEmailAsync(order.CustomerEmail, $"Xác nhận đơn hàng #{order.Id.ToString().Substring(0, 8)} - Nguyệt Nhãn Phố Hiến", invoiceHtml);
                    _logger.LogInformation("Đã gửi email xác nhận đơn {OrderId} tới khách {Email}.", order.Id, order.CustomerEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "GỬI THẤT BẠI email xác nhận cho khách {Email} (đơn {OrderId}) sau 3 lần thử — email có thể bị mất, cần gửi thủ công!",
                        order.CustomerEmail, order.Id);
                }
            }

            // Send to Admin
            string adminSummaryItems = string.Join("<br/>", order.Items.Select(i => $"- {i.ProductName} {(string.IsNullOrWhiteSpace(i.ProductSize) ? "" : $"({i.ProductSize})")} x{i.Quantity} ({i.TotalPrice:N0}đ)"));
            string adminHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;'>
                    <h2 style='color: #E53935;'>CÓ ĐƠN HÀNG MỚI ({order.Items.Count} loại sản phẩm)</h2>
                    <p><strong>Khách hàng:</strong> {order.CustomerName} ({order.CustomerPhone})</p>
                    <p><strong>Email:</strong> {order.CustomerEmail ?? "Không có"}</p>
                    <p><strong>Địa chỉ:</strong> {order.CustomerAddress}</p>
                    <p><strong>Sản phẩm mua:</strong><br/>{adminSummaryItems}</p>
                    <p><strong>Tổng thanh toán:</strong> {order.TotalAmount:N0} đ</p>
                    <p><strong>Ghi chú:</strong> {order.Note ?? "Không"}</p>
                    <p><a href='{_frontendBaseUrl}/orders'>Vào Dashboard để xem chi tiết</a></p>
                </div>";

            try
            {
                await _emailService.SendEmailAsync(adminEmail, $"Đơn hàng mới từ {order.CustomerName}", adminHtml);
                _logger.LogInformation("Đã gửi email thông báo đơn {OrderId} tới admin {AdminEmail}.", order.Id, adminEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "GỬI THẤT BẠI email thông báo cho ADMIN (đơn {OrderId}) sau 3 lần thử — đơn này có thể chưa được chủ cửa hàng biết đến!",
                    order.Id);
            }
        }
        catch (Exception ex)
        {
            // Lưới an toàn cuối cùng — không để lỗi trong Task.Run bị nuốt im lặng.
            _logger.LogError(ex, "Lỗi bất ngờ khi xử lý email cho đơn {OrderId}.", order.Id);
        }
    }

    public async Task<IEnumerable<OrderResponse>> GetAllOrdersAsync()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToResponse);
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        return order == null ? null : MapToResponse(order);
    }

    public async Task<OrderResponse> UpdateOrderStatusAsync(Guid id, string status)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với Id: {id}");

        if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
            throw new ArgumentException($"Trạng thái không hợp lệ: {status}");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(order);
    }

    private static OrderResponse MapToResponse(Order order)
    {
        var items = order.Items.Select(i => new OrderItemResponse
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            ProductSize = i.ProductSize,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            TotalPrice = i.TotalPrice
        }).ToList();

        var firstItem = items.FirstOrDefault();

        return new OrderResponse
        {
            Id = order.Id,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            CustomerEmail = order.CustomerEmail,
            CustomerAddress = order.CustomerAddress,
            Note = order.Note,
            BaseAmount = order.BaseAmount,
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            DiscountCodeApplied = order.DiscountCodeApplied,
            Status = order.Status.ToString(),
            Items = items,
            // Fallback
            ProductName = firstItem?.ProductName ?? order.ProductName ?? string.Empty,
            ProductSize = firstItem?.ProductSize ?? order.ProductSize,
            Quantity = firstItem?.Quantity ?? order.Quantity,
            CreatedAt = order.CreatedAt
        };
    }
}
