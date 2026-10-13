namespace NguyetnhanPhohien.Application.Payment;

/// <summary>
/// Key lưu thông tin nhận thanh toán trong bảng WebsiteContents.
///
/// Vì sao dùng lại bảng key/value sẵn có thay vì tạo bảng mới: chỉ có ĐÚNG 3 giá trị
/// cấu hình, không cần migration/thêm DbSet, và trang quản trị đã có hạ tầng đọc/ghi
/// WebsiteContents. Đổi lại phải LỌC các key này ra khỏi GET /api/content công khai
/// (ContentService) — chúng là cấu hình vận hành, không phải nội dung Landing Page.
/// </summary>
public static class PaymentSettingKeys
{
    public const string BankId = "PaymentBankId";
    public const string AccountNumber = "PaymentAccountNumber";
    public const string AccountName = "PaymentAccountName";

    /// <summary>Danh sách key — dùng cho truy vấn IN (...) và cho việc lọc.</summary>
    public static readonly string[] All = { BankId, AccountNumber, AccountName };

    public static bool IsPaymentKey(string? key) =>
        !string.IsNullOrWhiteSpace(key) && All.Contains(key, StringComparer.OrdinalIgnoreCase);
}
