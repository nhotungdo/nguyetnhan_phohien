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
    public string? Note { get; set; }

    // Thông tin đơn
    public decimal TotalAmount { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.PendingConfirmation;
    public string? DiscountCodeApplied { get; set; }
    public decimal DiscountAmount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
