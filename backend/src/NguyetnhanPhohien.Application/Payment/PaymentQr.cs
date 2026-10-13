using NguyetnhanPhohien.Application.DTOs.Payment;

namespace NguyetnhanPhohien.Application.Payment;

/// <summary>
/// Sinh URL ảnh QR VietQR động từ thông tin nhận thanh toán.
///
/// Hàm thuần (không phụ thuộc DB/HTTP) để cả OrderService (email hóa đơn) và bất kỳ
/// nơi nào khác dùng chung MỘT định dạng URL. Nếu đổi định dạng ở đây thì phải đổi
/// bản sao phía frontend (<c>frontend/src/lib/vietqr.ts</c>) — hai nơi dùng CHUNG
/// công thức thì ảnh xem trước trong trang quản trị mới khớp đúng QR gửi cho khách.
/// </summary>
public static class PaymentQr
{
    /// <summary>
    /// URL ảnh QR (SVG) với số tiền và nội dung chuyển khoản điền sẵn.
    /// Mọi tham số đều được URL-encode: nội dung chuyển khoản và tên chủ tài khoản
    /// có dấu cách, để thô trong query sẽ khiến một số app ngân hàng dựng QR sai.
    /// </summary>
    public static string Build(PaymentSettingsDto settings, decimal amount, string transferNote)
    {
        // Chuẩn hóa trước khi ghép URL (xem PaymentSettingsNormalizer): số tài khoản
        // có dấu cách sẽ tạo ra URL/mã QR sai.
        var bankId = PaymentSettingsNormalizer.BankId(settings.BankId);
        var accountNumber = PaymentSettingsNormalizer.AccountNumber(settings.AccountNumber);
        var accountName = PaymentSettingsNormalizer.AccountName(settings.AccountName);

        var url = $"https://img.vietqr.io/image/{bankId}-{accountNumber}-compact.svg"
            + $"?amount={amount}";

        if (!string.IsNullOrWhiteSpace(transferNote))
            url += $"&addInfo={Uri.EscapeDataString(transferNote.Trim())}";

        if (accountName.Length > 0)
            url += $"&accountName={Uri.EscapeDataString(accountName)}";

        return url;
    }
}
