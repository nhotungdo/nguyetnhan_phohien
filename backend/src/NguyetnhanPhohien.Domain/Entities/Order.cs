using System;
using NguyetnhanPhohien.Domain.Enums;

namespace NguyetnhanPhohien.Domain.Entities;

public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Thông tin khách mua (không cần tài khoản)
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string CustomerAddress { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? Note { get; set; }

    // Legacy: Tương thích với đơn cũ (1 sản phẩm đơn lẻ)
    public Guid? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductSize { get; set; }
    public int Quantity { get; set; } = 1;

    // Danh sách sản phẩm mua trong đơn hàng
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    // Thông tin đơn
    public decimal BaseAmount { get; set; }          // Tiền hàng = giá DB x số lượng
    public decimal TotalAmount { get; set; }         // = BaseAmount - DiscountAmount, luôn >= 0
    public OrderStatus Status { get; set; } = OrderStatus.PendingConfirmation;
    public string? DiscountCodeApplied { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
