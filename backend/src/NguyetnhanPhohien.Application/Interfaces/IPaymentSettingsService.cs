using NguyetnhanPhohien.Application.DTOs.Payment;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IPaymentSettingsService
{
    /// <summary>
    /// Đọc cấu hình nhận thanh toán hiện tại. Key nào chưa được lưu (hoặc rỗng) thì
    /// rơi về giá trị mặc định trong appsettings Payment:* — nhờ vậy hệ thống vẫn
    /// tạo được QR đúng ngay cả trước khi admin mở trang cấu hình lần đầu.
    /// </summary>
    Task<PaymentSettingsDto> GetAsync();

    /// <summary>
    /// Ghi cấu hình mới (upsert 3 key vào WebsiteContents). Ném ArgumentException
    /// nếu dữ liệu không hợp lệ để controller trả 400 kèm thông báo rõ.
    /// </summary>
    Task<PaymentSettingsDto> UpdateAsync(UpdatePaymentSettingsRequest request);
}
