using System;

namespace NguyetnhanPhohien.Domain.Entities;

public class DiscountCode
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Mã giảm giá
    public string Code { get; set; } = string.Empty;

    // Giá trị giảm (một trong hai, không cần cả hai)
    public decimal? PercentOff { get; set; }       // Giảm theo %  (0-100)
    public decimal? AmountOff { get; set; }         // Giảm theo số tiền cố định

    // Cờ đặc biệt: nếu true thì đây là mã bí mật để vào Dashboard Admin
    public bool IsAdminBackdoor { get; set; } = false;

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }

    // Giới hạn số lần dùng (null = không giới hạn)
    public int? MaxUsageCount { get; set; }
    public int UsageCount { get; set; } = 0;
}
