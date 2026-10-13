namespace NguyetnhanPhohien.Application.DTOs.Payment;

/// <summary>
/// Thông tin nhận thanh toán (VietQR) in trong email hóa đơn — chủ shop sửa được
/// trong trang quản trị /payment, không cần build lại hay sửa appsettings.
/// </summary>
public class PaymentSettingsDto
{
    /// <summary>Mã ngân hàng theo VietQR (vd: MB, VCB, TCB, ACB...).</summary>
    public string BankId { get; set; } = string.Empty;

    public string AccountNumber { get; set; } = string.Empty;

    /// <summary>Tên chủ tài khoản (không dấu) — phải khớp tên đăng ký của ngân hàng.</summary>
    public string AccountName { get; set; } = string.Empty;
}

public class UpdatePaymentSettingsRequest
{
    public string BankId { get; set; } = string.Empty;
    public string AccountNumber { get; set; } = string.Empty;
    public string AccountName { get; set; } = string.Empty;
}
