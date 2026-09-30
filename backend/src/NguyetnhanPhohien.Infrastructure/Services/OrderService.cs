using Microsoft.EntityFrameworkCore;
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

    public OrderService(AppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request)
    {
        // ===== 1. VALIDATE SẢN PHẨM — tính tiền từ giá trong DB, KHÔNG tin client =====
        if (!Guid.TryParse(request.ProductId, out var productId))
            throw new ArgumentException("Sản phẩm không hợp lệ.");

        if (request.Quantity < 1 || request.Quantity > 999)
            throw new ArgumentException("Số lượng phải từ 1 đến 999.");

        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive)
            ?? throw new ArgumentException("Sản phẩm không tồn tại hoặc đã ngừng bán.");

        var baseAmount = product.Price * request.Quantity;

        // ===== 2. VALIDATE MÃ GIẢM GIÁ (kể cả hạn dùng + số lượt) và tính số tiền giảm =====
        decimal discountAmount = 0;
        DiscountCode? appliedDiscount = null;

        if (!string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            var code = request.DiscountCode.Trim();
            var discountCode = await _db.DiscountCodes
                .FirstOrDefaultAsync(d => d.Code == code && d.IsActive && !d.IsAdminBackdoor)
                ?? throw new ArgumentException("Mã giảm giá không hợp lệ.");

            if (discountCode.ExpiresAt.HasValue && discountCode.ExpiresAt.Value < DateTime.UtcNow)
                throw new ArgumentException("Mã giảm giá đã hết hạn.");

            if (discountCode.MaxUsageCount.HasValue && discountCode.UsageCount >= discountCode.MaxUsageCount.Value)
                throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");

            // Giới hạn giảm giá luôn bị kẹp bởi baseAmount thật:
            // - PercentOff chỉ chấp nhận (0, 100]
            // - AmountOff không bao giờ giảm quá tiền hàng
            // => tổng tiền của đơn KHÔNG BAO GIỜ âm.
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

        // ===== 3. TẠO ĐƠN =====
        var order = new Order
        {
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            CustomerAddress = request.CustomerAddress,
            Note = request.Note,
            ProductId = productId,
            ProductName = product.Name,
            ProductSize = product.Size,
            Quantity = request.Quantity,
            BaseAmount = baseAmount,
            TotalAmount = baseAmount - discountAmount,
            DiscountAmount = discountAmount,
            DiscountCodeApplied = appliedDiscount?.Code,
            Status = OrderStatus.PendingConfirmation,
            CreatedAt = DateTime.UtcNow
        };

        // ===== 4. TĂNG LƯỢT DÙNG MÃ NGUYÊN TỬ (đúng 1 lần / đơn, tại thời điểm tạo đơn) =====
        if (appliedDiscount != null)
        {
            // UPDATE có điều kiện WHERE UsageCount < MaxUsageCount: chặn race condition
            // khi nhiều đơn cùng lúc vượt quá MaxUsageCount.
            var affected = await _db.DiscountCodes
                .Where(d => d.Id == appliedDiscount.Id
                    && (!d.MaxUsageCount.HasValue || d.UsageCount < d.MaxUsageCount.Value))
                .ExecuteUpdateAsync(s => s.SetProperty(d => d.UsageCount, d => d.UsageCount + 1));

            if (affected == 0)
                throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        // Gửi email bất đồng bộ (fire-and-forget)
        _ = Task.Run(() => SendOrderEmailsAsync(order));

        return MapToResponse(order);
    }

    private async Task SendOrderEmailsAsync(Order order)
    {
        try
        {
            string adminEmail = "nhotungdo89@gmail.com";

            // Build HTML
            string invoiceHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
                    <h2 style='color: #4CAF50; text-align: center;'>Hóa đơn mua hàng - Nguyệt Nhãn Phố Hiến</h2>
                    <p>Xin chào <strong>{order.CustomerName}</strong>,</p>
                    <p>Cảm ơn bạn đã đặt hàng tại Nguyệt Nhãn Phố Hiến. Dưới đây là thông tin đơn hàng của bạn:</p>
                    <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Mã đơn hàng</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.Id}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Sản phẩm</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.ProductName} ({order.ProductSize}) x {order.Quantity}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Điện thoại</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.CustomerPhone}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Địa chỉ nhận</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.CustomerAddress}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Ghi chú</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.Note ?? "Không"}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Tiền hàng</td>
                            <td style='padding: 8px; border: 1px solid #ddd;'>{order.BaseAmount:N0} đ</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Giảm giá{(order.DiscountCodeApplied != null ? $" ({order.DiscountCodeApplied})" : "")}</td>
                            <td style='padding: 8px; border: 1px solid #ddd; color: #E53935;'>- {order.DiscountAmount:N0} đ</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 16px;'>Tổng thanh toán</td>
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold; font-size: 16px; color: #2E7D32;'>{order.TotalAmount:N0} đ</td>
                        </tr>
                    </table>
                    <p style='margin-top: 20px;'>Chúng tôi sẽ sớm liên hệ với bạn để xác nhận và giao hàng.</p>
                    <p>Trân trọng,<br/><strong>Nguyệt Nhãn Phố Hiến</strong></p>
                </div>";

            // Send to customer
            if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                await _emailService.SendEmailAsync(order.CustomerEmail, $"Xác nhận đơn hàng #{order.Id.ToString().Substring(0, 8)} - Nguyệt Nhãn Phố Hiến", invoiceHtml);
            }

            // Send to Admin
            string adminHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;'>
                    <h2 style='color: #E53935;'>CÓ ĐƠN HÀNG MỚI</h2>
                    <p><strong>Khách hàng:</strong> {order.CustomerName} ({order.CustomerPhone})</p>
                    <p><strong>Email:</strong> {order.CustomerEmail ?? "Không có"}</p>
                    <p><strong>Địa chỉ:</strong> {order.CustomerAddress}</p>
                    <p><strong>Sản phẩm:</strong> {order.ProductName} ({order.ProductSize}) x {order.Quantity}</p>
                    <p><strong>Tổng tiền:</strong> {order.TotalAmount:N0} đ</p>
                    <p><strong>Ghi chú:</strong> {order.Note}</p>
                    <p><a href='http://localhost:3000/orders'>Vào Dashboard để xem chi tiết</a></p>
                </div>";

            await _emailService.SendEmailAsync(adminEmail, $"Đơn hàng mới từ {order.CustomerName}", adminHtml);
        }
        catch (Exception ex)
        {
            // Bỏ qua lỗi gửi email để không ảnh hưởng luồng chính
            Console.WriteLine($"[EMAIL SEND ERROR] {ex.Message}");
            Console.WriteLine(ex.ToString());
        }
    }

    public async Task<IEnumerable<OrderResponse>> GetAllOrdersAsync()
    {
        var orders = await _db.Orders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToResponse);
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _db.Orders.FindAsync(id);
        return order == null ? null : MapToResponse(order);
    }

    public async Task<OrderResponse> UpdateOrderStatusAsync(Guid id, string status)
    {
        var order = await _db.Orders.FindAsync(id)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với Id: {id}");

        if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
            throw new ArgumentException($"Trạng thái không hợp lệ: {status}");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(order);
    }

    private static OrderResponse MapToResponse(Order order) => new()
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
        ProductName = order.ProductName,
        ProductSize = order.ProductSize,
        Quantity = order.Quantity,
        CreatedAt = order.CreatedAt
    };
}
