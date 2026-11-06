using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using NguyetnhanPhohien.Application.DTOs.Content;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Application.Payment;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ContentService : IContentService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IMemoryCache? _cache;

    public ContentService(AppDbContext db, IWebHostEnvironment env, IMemoryCache? cache = null)
    {
        _db = db;
        _env = env;
        _cache = cache;
    }

    public async Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync()
    {
        // Loại các key cấu hình nhận thanh toán (xem PaymentSettingKeys): chúng nằm
        // CÙNG bảng nhưng là cấu hình vận hành, không phải nội dung Landing Page.
        // Trả ra đây vừa làm bẩn map nội dung phía client vừa mở đường cho khách đọc
        // số tài khoản qua endpoint công khai.
        var contents = await _db.WebsiteContents
            .AsNoTracking()
            .Where(w => !PaymentSettingKeys.All.Contains(w.Key))
            .ToListAsync();
        return contents.Select(MapToResponse);
    }

    public async Task<WebsiteContentResponse?> GetContentByKeyAsync(string key)
    {
        // Endpoint GET /api/content/{key} là công khai → không cho đọc key cấu hình
        // thanh toán qua đây (trả null để controller trả 404 như key không tồn tại).
        if (PaymentSettingKeys.IsPaymentKey(key)) return null;

        var content = await _db.WebsiteContents.AsNoTracking().FirstOrDefaultAsync(w => w.Key == key);
        return content == null ? null : MapToResponse(content);
    }

    public async Task<WebsiteContentResponse> UpsertContentAsync(UpdateContentRequest request)
    {
        var existing = await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == request.Key);

        if (existing != null)
        {
            existing.Value = request.Value;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            existing = new WebsiteContent
            {
                Key = request.Key,
                Value = request.Value
            };
            _db.WebsiteContents.Add(existing);
        }

        await _db.SaveChangesAsync();

        // Đồng bộ ảnh nếu key thuộc giao diện Tự chọn hạt (Custom Mix Studio)
        await SyncCustomMixAssetsAsync(request.Key, request.Value);

        return MapToResponse(existing);
    }

    /// <summary>
    /// Các key nội dung là Ô ẢNH trên landing page và trang Tự chọn hạt (Custom Mix) —
    /// chỉ key này mới nhận upload, tránh ghi đè key văn bản tùy ý bằng đường dẫn file.
    /// </summary>
    private static readonly string[] ImageKeys =
    {
        // 1. Ảnh Landing Page (Trang Chủ)
        "SiteLogo",       // logo header + footer
        "HeroBannerUrl",  // ảnh banner hero
        "StoryImage",     // ảnh mục câu chuyện
        "CultureImage",   // ảnh mục văn hóa

        // 2. Ảnh Bao Bì Quy Cách Đóng Gói (Trang Tự Chọn Hạt)
        "CustomMix_Pkg_ZipBag",   // Bao bì: Túi Zip 150g
        "CustomMix_Pkg_Box",      // Bao bì: Hộp Mica 300g
        "CustomMix_Pkg_GiftSet",  // Bao bì: Lễ Hộp Hoàng Gia 900g

        // 3. Ảnh 5 Loại Hạt Đặc Sản & Dinh Dưỡng (Trang Tự Chọn Hạt)
        "CustomMix_Nut_LongNhan", // Hạt: Long Nhãn Phố Hiến
        "CustomMix_Nut_Macca",    // Hạt: Hạt Macca Tây Nguyên
        "CustomMix_Nut_HatDieu",  // Hạt: Hạt Điều Bình Phước
        "CustomMix_Nut_HanhNhan", // Hạt: Hạnh Nhân California
        "CustomMix_Nut_BiXanh",   // Hạt: Hạt Bí Xanh Ấn Độ

        // 4. Banner trang Tự Chọn Hạt
        "CustomMix_BannerUrl"     // Banner đầu trang Tự chọn hạt
    };

    private async Task SyncCustomMixAssetsAsync(string key, string? imageUrl)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return;

        bool updated = false;

        switch (key)
        {
            case "CustomMix_Pkg_ZipBag":
                var zip = await _db.CustomPackagings.FirstOrDefaultAsync(p => p.PackagingType == "ZipBag" || p.Id == Guid.Parse("c0000001-0000-0000-0000-000000000150"));
                if (zip != null) { zip.ImageUrl = imageUrl; zip.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Pkg_Box":
                var box = await _db.CustomPackagings.FirstOrDefaultAsync(p => p.PackagingType == "Box" || p.Id == Guid.Parse("c0000001-0000-0000-0000-000000000300"));
                if (box != null) { box.ImageUrl = imageUrl; box.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Pkg_GiftSet":
                var gift = await _db.CustomPackagings.FirstOrDefaultAsync(p => p.PackagingType == "GiftSet" || p.Id == Guid.Parse("c0000001-0000-0000-0000-000000000900"));
                if (gift != null) { gift.ImageUrl = imageUrl; gift.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;

            case "CustomMix_Nut_LongNhan":
                var ln = await _db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == Guid.Parse("d0000001-0000-0000-0000-000000000001") || i.Name.Contains("Long Nhãn"));
                if (ln != null) { ln.ImageUrl = imageUrl; ln.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Nut_Macca":
                var macca = await _db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == Guid.Parse("d0000001-0000-0000-0000-000000000003") || i.Name.Contains("Macca"));
                if (macca != null) { macca.ImageUrl = imageUrl; macca.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Nut_HatDieu":
                var dieu = await _db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == Guid.Parse("d0000001-0000-0000-0000-000000000004") || i.Name.Contains("Điều"));
                if (dieu != null) { dieu.ImageUrl = imageUrl; dieu.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Nut_HanhNhan":
                var hn = await _db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == Guid.Parse("d0000001-0000-0000-0000-000000000005") || i.Name.Contains("Hạnh Nhân"));
                if (hn != null) { hn.ImageUrl = imageUrl; hn.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
            case "CustomMix_Nut_BiXanh":
                var bi = await _db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == Guid.Parse("d0000001-0000-0000-0000-000000000006") || i.Name.Contains("Bí Xanh"));
                if (bi != null) { bi.ImageUrl = imageUrl; bi.UpdatedAt = DateTime.UtcNow; updated = true; }
                break;
        }

        if (updated)
        {
            await _db.SaveChangesAsync();
            _cache?.Remove("custom_mix_options_cache");
        }
    }

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentKey)
    {
        if (string.IsNullOrWhiteSpace(contentKey) || !ImageKeys.Contains(contentKey, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException($"Key ảnh không hợp lệ: {contentKey}");

        // Chuẩn hóa về ĐÚNG key trong whitelist trước khi ghi DB: so khớp không phân
        // biệt hoa/thường nhưng ghi key nguyên bản thì "herobannerurl" tạo row riêng,
        // còn Landing Page chỉ đọc "HeroBannerUrl" → ảnh không bao giờ hiển thị.
        var canonicalKey = ImageKeys.First(k => k.Equals(contentKey, StringComparison.OrdinalIgnoreCase));

        // Cùng một nguồn gốc với ProductService (xem UploadPathResolver): ghi vào
        // đúng thư mục UseStaticFiles phục vụ để URL /uploads/... luôn truy cập được.
        var contentDir = UploadPathResolver.Directory(
            _env, "uploads", "content", canonicalKey.ToLowerInvariant());

        // Chỉ giữ đuôi file thuộc whitelist (phòng hờ nếu caller
        // quên validate ở controller): không bao giờ ghi được .html/.js vào wwwroot.
        var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!allowedExts.Contains(ext)) ext = ".jpg";
        var uniqueFileName = $"{canonicalKey}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(contentDir, uniqueFileName);

        using (var fs = File.Create(filePath))
        {
            await imageStream.CopyToAsync(fs);
        }

        var relativePath = $"/uploads/content/{canonicalKey.ToLowerInvariant()}/{uniqueFileName}";

        // Đọc URL ảnh cũ TRƯỚC khi upsert, để dọn file cũ sau khi đã lưu xong.
        var oldRelativePath = (await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == canonicalKey))?.Value;

        await UpsertContentAsync(new UpdateContentRequest
        {
            Key = canonicalKey,
            Value = relativePath
        });

        // Dọn ảnh cũ: mỗi lần upload là một file mới nên không dọn thì wwwroot phình vô hạn.
        // Chỉ đụng file nằm trong /uploads/ và không chứa ".." (chặn path traversal).
        var oldFilePath = UploadPathResolver.ResolveUploadFile(_env, oldRelativePath);
        if (oldFilePath != null
            && !string.Equals(oldFilePath, filePath, StringComparison.OrdinalIgnoreCase)
            && File.Exists(oldFilePath))
        {
            try { File.Delete(oldFilePath); }
            catch { /* file đang bị mở hoặc đã bị dọn trước đó — bỏ qua */ }
        }

        return relativePath;
    }

    private static WebsiteContentResponse MapToResponse(WebsiteContent c) => new()
    {
        Key = c.Key,
        Value = c.Value,
        Description = c.Description
    };
}
