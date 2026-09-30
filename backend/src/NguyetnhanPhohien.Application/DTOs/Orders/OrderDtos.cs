namespace NguyetnhanPhohien.Application.DTOs.Orders;

// DTO nhận dữ liệu từ Form đặt hàng của khách
public class CreateOrderRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }
    public decimal TotalAmount { get; set; }
    public string? DiscountCode { get; set; }
}

// DTO trả về khi tạo đơn thành công
public class OrderResponse
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DiscountCodeApplied { get; set; }
    public DateTime CreatedAt { get; set; }
}

// DTO Admin dùng để cập nhật trạng thái đơn
public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
