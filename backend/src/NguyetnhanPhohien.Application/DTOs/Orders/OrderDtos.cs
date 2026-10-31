using System;
using System.Collections.Generic;
using NguyetnhanPhohien.Application.DTOs.CustomMix;

namespace NguyetnhanPhohien.Application.DTOs.Orders;

public class OrderItemRequest
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public bool IsCustomMix { get; set; } = false;
    public CustomMixItemDetailDto? CustomMixDetails { get; set; }
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
    public bool IsCustomMix { get; set; } = false;
    public string? CustomDetailsJson { get; set; }
    public CustomMixItemDetailDto? CustomDetails { get; set; }
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

    // Trạng thái gửi email hóa đơn cho khách hàng
    public DateTime? InvoiceEmailSentAt { get; set; }
    public string? InvoiceEmailError { get; set; }

    public DateTime CreatedAt { get; set; }
}

// DTO Admin dùng để cập nhật trạng thái đơn
public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}

// DTO Admin dùng để gửi lại email xác nhận hủy đơn
public class ResendCancellationRequest
{
    public string? Reason { get; set; }
}

// DTO công khai hiển thị hoạt động đặt hàng gần đây (Social Proof) - Đã ẩn danh bảo mật
public class RecentOrderActivityDto
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImage { get; set; }
    public int Quantity { get; set; } = 1;
    public string TimeAgo { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public static string MaskName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return "Khách hàng";
        var parts = fullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1) return parts[0];

        var first = parts[0];
        var last = parts[^1];
        var maskedLast = last.Length > 1 ? last[..1] + "*" : last;
        return $"{first} {maskedLast}";
    }

    public static string ExtractLocation(string? address)
    {
        if (string.IsNullOrWhiteSpace(address)) return "Việt Nam";
        var parts = address.Trim().Split(',', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 1) return parts[0].Trim();
        if (parts.Length == 2) return $"{parts[0].Trim()}, {parts[1].Trim()}";
        return $"{parts[^2].Trim()}, {parts[^1].Trim()}";
    }
}
