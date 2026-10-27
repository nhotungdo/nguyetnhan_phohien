using System;
using NguyetnhanPhohien.Domain.Enums;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Bảng hàng đợi Email Outbox phục vụ Transactional Outbox Pattern:
/// Đảm bảo email luôn được lưu bền vững vào DB cùng transaction đặt hàng,
/// không bị mất khi ứng dụng crash / restart / deploy.
/// Background processor quét và gửi với cơ chế retry lũy thừa (exponential backoff).
/// </summary>
public class EmailOutbox
{
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>Khóa ngoại tới Order (null nếu là email độc lập như báo cáo)</summary>
    public Guid? OrderId { get; set; }

    /// <summary>Loại email: "OrderInvoice", "AdminNotification", "OrderCancellation", v.v.</summary>
    public string EmailType { get; set; } = string.Empty;

    public string RecipientEmail { get; set; } = string.Empty;

    public string Subject { get; set; } = string.Empty;

    public string HtmlBody { get; set; } = string.Empty;

    public string PlainTextBody { get; set; } = string.Empty;

    public EmailOutboxStatus Status { get; set; } = EmailOutboxStatus.Pending;

    public int RetryCount { get; set; } = 0;

    public int MaxRetries { get; set; } = 3;

    public string? LastError { get; set; }

    public DateTime? NextRetryAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? SentAt { get; set; }
}
