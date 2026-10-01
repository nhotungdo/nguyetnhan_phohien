using System;
using System.Collections.Generic;

namespace NguyetnhanPhohien.Application.DTOs.Orders;

public class OrderItemRequest
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
}

public class OrderItemResponse
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductSize { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
}

// DTO nhận dữ liệu từ Form đặt hàng của khách.
// KHÔNG nhận TotalAmount từ client — tổng tiền luôn được backend tính từ giá sản phẩm trong DB.
public class CreateOrderRequest
{
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }
    public string? DiscountCode { get; set; }

    // Danh sách sản phẩm mua trong đơn
    public List<OrderItemRequest>? Items { get; set; }

    // Fallback cho đơn hàng 1 sản phẩm (Legacy)
    public string? ProductId { get; set; }
    public int? Quantity { get; set; }
}

// DTO trả về khi tạo đơn thành công hoặc lấy chi tiết đơn
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

    // Danh sách các mặt hàng trong đơn
    public List<OrderItemResponse> Items { get; set; } = new();

    // Legacy fallback fields
    public string? ProductName { get; set; }
    public string? ProductSize { get; set; }
    public int Quantity { get; set; }
    public DateTime CreatedAt { get; set; }
}

// DTO Admin dùng để cập nhật trạng thái đơn
public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
