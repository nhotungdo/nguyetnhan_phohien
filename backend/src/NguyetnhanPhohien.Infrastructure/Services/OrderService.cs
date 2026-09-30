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
        decimal discountAmount = 0;

        // Xử lý mã giảm giá nếu có
        if (!string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            var discountCode = await _db.DiscountCodes
                .FirstOrDefaultAsync(d => d.Code == request.DiscountCode
                    && d.IsActive
                    && !d.IsAdminBackdoor);

            if (discountCode != null)
            {
                if (discountCode.PercentOff.HasValue)
                    discountAmount = request.TotalAmount * (discountCode.PercentOff.Value / 100m);
                else if (discountCode.AmountOff.HasValue)
                    discountAmount = discountCode.AmountOff.Value;

                discountCode.UsageCount++;
            }
        }

        var order = new Order
        {
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            CustomerAddress = request.CustomerAddress,
            Note = request.Note,
            TotalAmount = request.TotalAmount - discountAmount,
            DiscountAmount = discountAmount,
            DiscountCodeApplied = request.DiscountCode,
            Status = OrderStatus.PendingConfirmation,
            CreatedAt = DateTime.UtcNow
        };

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
                            <td style='padding: 8px; border: 1px solid #ddd; font-weight: bold;'>Giảm giá</td>
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
                    <p><strong>Tổng tiền:</strong> {order.TotalAmount:N0} đ</p>
                    <p><strong>Ghi chú:</strong> {order.Note}</p>
                    <p><a href='http://localhost:3000/dashboard/orders'>Vào Dashboard để xem chi tiết</a></p>
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
        TotalAmount = order.TotalAmount,
        DiscountAmount = order.DiscountAmount,
        DiscountCodeApplied = order.DiscountCodeApplied,
        Status = order.Status.ToString(),
        CreatedAt = order.CreatedAt
    };
}
