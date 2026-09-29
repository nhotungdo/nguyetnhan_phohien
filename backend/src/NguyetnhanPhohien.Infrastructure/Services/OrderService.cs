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

    public OrderService(AppDbContext db)
    {
        _db = db;
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

        return MapToResponse(order);
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
        CustomerAddress = order.CustomerAddress,
        Note = order.Note,
        TotalAmount = order.TotalAmount,
        DiscountAmount = order.DiscountAmount,
        DiscountCodeApplied = order.DiscountCodeApplied,
        Status = order.Status.ToString(),
        CreatedAt = order.CreatedAt
    };
}
