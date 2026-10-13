using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NguyetnhanPhohien.Application.DTOs.Payment;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Application.Payment;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

/// <summary>
/// Đọc/ghi thông tin nhận thanh toán của cửa hàng.
///
/// Lưu trong WebsiteContents (3 key trong <see cref="PaymentSettingKeys"/>) nên không
/// cần migration. appsettings Payment:* đóng vai trò GIÁ TRỊ MẶC ĐỊNH: key chưa được
/// admin lưu (hoặc bị xoá trắng) sẽ rơi về mặc định, tránh tạo ra QR thiếu số tài khoản.
/// </summary>
public class PaymentSettingsService : IPaymentSettingsService
{
    private readonly AppDbContext _db;
    private readonly PaymentSettingsDto _defaults;

    public PaymentSettingsService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _defaults = new PaymentSettingsDto
        {
            BankId = (config["Payment:BankId"] ?? "MB").Trim(),
            AccountNumber = (config["Payment:AccountNumber"] ?? "868606052004").Trim(),
            AccountName = (config["Payment:AccountName"] ?? "NGUYET NHAN PHO HIEN").Trim()
        };
    }

    public async Task<PaymentSettingsDto> GetAsync()
    {
        // Chỉ lấy đúng 3 key thanh toán — không kéo toàn bộ nội dung website về.
        var rows = await _db.WebsiteContents
            .Where(w => PaymentSettingKeys.All.Contains(w.Key))
            .ToDictionaryAsync(w => w.Key, w => w.Value);

        return new PaymentSettingsDto
        {
            BankId = Pick(rows, PaymentSettingKeys.BankId, _defaults.BankId),
            AccountNumber = Pick(rows, PaymentSettingKeys.AccountNumber, _defaults.AccountNumber),
            AccountName = Pick(rows, PaymentSettingKeys.AccountName, _defaults.AccountName)
        };
    }

    public async Task<PaymentSettingsDto> UpdateAsync(UpdatePaymentSettingsRequest request)
    {
        // Chuẩn hóa dùng CHUNG với PaymentQr.Build (xem PaymentSettingsNormalizer) để giá
        // trị lưu trong DB đúng BẰNG giá trị ghép vào URL QR — không có ca "lưu thì sạch
        // nhưng URL lại mang dấu cách" làm mã QR của khách hỏng.
        var bankId = PaymentSettingsNormalizer.BankId(request.BankId);
        var accountNumber = PaymentSettingsNormalizer.AccountNumber(request.AccountNumber);
        var accountName = PaymentSettingsNormalizer.AccountName(request.AccountName);

        if (bankId.Length == 0)
            throw new ArgumentException("Vui lòng nhập mã ngân hàng (vd: MB, VCB, TCB).");
        if (!PaymentSettingsNormalizer.IsAlphanumeric(bankId))
            throw new ArgumentException("Mã ngân hàng chỉ gồm chữ và số (vd: MB, VCB, TCB).");
        if (bankId.Length > PaymentSettingsNormalizer.MaxBankIdLength)
            throw new ArgumentException($"Mã ngân hàng không được vượt quá {PaymentSettingsNormalizer.MaxBankIdLength} ký tự.");

        if (accountNumber.Length == 0)
            throw new ArgumentException("Số tài khoản không được để trống.");
        if (accountNumber.Length > PaymentSettingsNormalizer.MaxAccountNumberLength)
            throw new ArgumentException($"Số tài khoản không được vượt quá {PaymentSettingsNormalizer.MaxAccountNumberLength} ký tự.");

        if (accountName.Length == 0)
            throw new ArgumentException("Tên chủ tài khoản không được để trống.");
        if (accountName.Length > PaymentSettingsNormalizer.MaxAccountNameLength)
            throw new ArgumentException($"Tên chủ tài khoản không được vượt quá {PaymentSettingsNormalizer.MaxAccountNameLength} ký tự.");

        // Kiểm tra trước khi ghi: nếu một giá trị không hợp lệ thì KHÔNG lưu giá trị nào,
        // tránh để lại cấu hình nửa vời (số TK mới nhưng tên chủ TK cũ).
        await UpsertAsync(PaymentSettingKeys.BankId, bankId);
        await UpsertAsync(PaymentSettingKeys.AccountNumber, accountNumber);
        await UpsertAsync(PaymentSettingKeys.AccountName, accountName);

        await _db.SaveChangesAsync();

        return await GetAsync();
    }

    private async Task UpsertAsync(string key, string value)
    {
        var existing = await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == key);
        if (existing != null)
        {
            existing.Value = value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _db.WebsiteContents.Add(new WebsiteContent
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.UtcNow
            });
        }
    }

    /// <summary>Giá trị đã lưu; rỗng/khoảng trắng coi như "chưa cấu hình" → dùng mặc định.</summary>
    private static string Pick(IReadOnlyDictionary<string, string> rows, string key, string fallback) =>
        rows.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value.Trim()
            : fallback;

}
