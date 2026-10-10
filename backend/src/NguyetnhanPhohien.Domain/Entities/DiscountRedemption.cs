using System;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Ghi nhận MỘT lần một số điện thoại đã dùng một mã giảm giá.
///
/// Quy tắc nghiệp vụ: mỗi số điện thoại chỉ được dùng một mã giảm giá ĐÚNG MỘT LẦN.
/// Unique index (DiscountCodeId, CustomerPhone) ở tầng DB là chốt chặn cuối, đảm bảo
/// kể cả khi hai request tới đồng thời (double-click, retry, script) thì chỉ một
/// request ghi được — request còn lại nhận lỗi unique thay vì âm thầm giảm giá lần hai.
/// </summary>
public class DiscountRedemption
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid DiscountCodeId { get; set; }

    /// <summary>Mã dạng chữ (đã chuẩn hóa IN HOA) — tiện tra cứu, không phải khóa chính.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Số điện thoại đã chuẩn hóa qua <see cref="PhoneNumber.Normalize"/>.</summary>
    public string CustomerPhone { get; set; } = string.Empty;

    /// <summary>Đơn hàng đã dùng mã này (null nếu chưa gắn được — chỉ xảy ra khi lỗi giữa chừng).</summary>
    public Guid? OrderId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
