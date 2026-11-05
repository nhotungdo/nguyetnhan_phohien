using NguyetnhanPhohien.Application.DTOs.Orders;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IOrderService
{
    Task<(OrderResponse Order, bool Created)> CreateOrderAsync(CreateOrderRequest request);
    Task<IEnumerable<OrderResponse>> GetAllOrdersAsync();
    Task<OrderResponse?> GetOrderByIdAsync(Guid id);
    Task<OrderResponse> UpdateOrderStatusAsync(Guid id, string status, int statusVersion, string? reason = null);
    Task ResendInvoiceAsync(Guid id);
    Task ResendCancellationEmailAsync(Guid id, string? reason = null);
    Task<IEnumerable<RecentOrderActivityDto>> GetRecentPublicOrdersAsync(int limit = 10);
}
