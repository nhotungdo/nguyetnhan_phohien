namespace NguyetnhanPhohien.Application.DTOs.Discount;

// DTO khách gửi lên để xác thực mã
public class ApplyDiscountRequest
{
    public string Code { get; set; } = string.Empty;
}

// DTO trả về khi apply mã thường (giảm giá)
public class DiscountResult
{
    public bool IsValid { get; set; }
    public bool IsAdminBackdoor { get; set; }

    // Nếu là mã thường:
    public decimal? PercentOff { get; set; }
    public decimal? AmountOff { get; set; }
    public string? Message { get; set; }

    // Nếu là mã Admin backdoor: trả về JWT token
    public string? AdminToken { get; set; }
}
