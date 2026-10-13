using System.Text;

namespace NguyetnhanPhohien.Application.Payment;

/// <summary>
/// Chuẩn hóa mã ngân hàng / số tài khoản / tên chủ tài khoản về CÙNG một dạng, dùng cho
/// cả hai việc: ghi vào DB (PaymentSettingsService) và ghép URL QR (PaymentQr).
///
/// Vì sao cần một chỗ định nghĩa chung: nếu chỉ chuẩn hóa lúc LƯU thì URL QR vẫn có thể
/// nhận giá trị thô từ dữ liệu cũ/cấu hình mặc định (vd số tài khoản gõ kèm dấu cách
/// "8686 0605 2004") → ảnh QR sai. Chuẩn hóa ở CẢ hai đầu (và lặp lại là vô hại vì hàm
/// idempotent) đảm bảo ảnh xem trước trong trang quản trị và QR trong email luôn khớp.
///
/// Bản sao phía frontend: <c>frontend/src/lib/vietqr.ts</c> — đổi ở đây thì phải đổi ở đó.
/// </summary>
public static class PaymentSettingsNormalizer
{
    public const int MaxBankIdLength = 20;
    public const int MaxAccountNumberLength = 34;
    public const int MaxAccountNameLength = 100;

    /// <summary>Mã ngân hàng: bỏ khoảng trắng thừa + IN HOA (VietQR dùng mã IN HOA, vd MB).</summary>
    public static string BankId(string? value) => (value ?? string.Empty).Trim().ToUpperInvariant();

    /// <summary>
    /// Số tài khoản: bỏ MỌI ký tự phân cách (dấu cách, dấu chấm, gạch) rồi IN HOA — người
    /// dùng hay dán "8686 0605 2004" từ app ngân hàng, giữ nguyên sẽ làm QR không hợp lệ.
    /// </summary>
    public static string AccountNumber(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;

        var sb = new StringBuilder(value.Length);
        foreach (var ch in value)
        {
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
        }

        return sb.ToString().ToUpperInvariant();
    }

    /// <summary>Tên chủ tài khoản: chỉ bỏ khoảng trắng thừa (có thể có dấu cách giữa các từ).</summary>
    public static string AccountName(string? value) => (value ?? string.Empty).Trim();

    public static bool IsAlphanumeric(string value) => value.All(char.IsLetterOrDigit);
}
