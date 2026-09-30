namespace NguyetnhanPhohien.Application.DTOs.Orders;

// DTO nhận dữ liệu từ Form đặt hàng của khách.
// KHÔNG nhận TotalAmount từ client — tổng tiền luôn được backend tính từ giá sản phẩm trong DB.
public class CreateOrderRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
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
    public decimal BaseAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? DiscountCodeApplied { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSize { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

// DTO Admin dùng để cập nhật trạng thái đơn
public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
