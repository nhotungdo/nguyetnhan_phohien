using NguyetnhanPhohien.Application.DTOs.Orders;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request);
    Task<IEnumerable<OrderResponse>> GetAllOrdersAsync();
    Task<OrderResponse?> GetOrderByIdAsync(Guid id);
    Task<OrderResponse> UpdateOrderStatusAsync(Guid id, string status);
}
