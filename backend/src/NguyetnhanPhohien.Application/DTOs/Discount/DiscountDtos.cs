namespace NguyetnhanPhohien.Application.DTOs.Discount;

// DTO khách gửi lên để xác thực mã.
// CustomerPhone (không bắt buộc) cho phép báo sớm "SĐT này đã dùng mã rồi"
// ngay khi bấm Áp dụng, thay vì đợi tới lúc gửi đơn mới báo lỗi.
public class ApplyDiscountRequest
{
    public string Code { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
}

// DTO trả về khi apply mã giảm giá.
// KHÔNG có trường token/backdoor: mã giảm giá không bao giờ cấp quyền admin
// (đăng nhập admin chỉ qua POST /api/auth/admin-login).
public class DiscountResult
{
    public bool IsValid { get; set; }

    // Giá trị giảm nếu mã hợp lệ:
    public decimal? PercentOff { get; set; }
    public decimal? AmountOff { get; set; }
    public string? Message { get; set; }
}

public class DiscountDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public decimal? PercentOff { get; set; }
    public decimal? AmountOff { get; set; }
    public bool IsAdminBackdoor { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUsageCount { get; set; }
    public int UsageCount { get; set; }
}

public class CreateDiscountRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal? PercentOff { get; set; }
    public decimal? AmountOff { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUsageCount { get; set; }
}

public class UpdateDiscountRequest
{
    public string Code { get; set; } = string.Empty;
    public decimal? PercentOff { get; set; }
    public decimal? AmountOff { get; set; }
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUsageCount { get; set; }
}
