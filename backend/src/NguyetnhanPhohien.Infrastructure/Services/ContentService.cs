using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Application.DTOs.Content;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ContentService : IContentService
{
    private readonly AppDbContext _db;

    public ContentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<WebsiteContentResponse>> GetAllContentAsync()
    {
        var contents = await _db.WebsiteContents.ToListAsync();
        return contents.Select(MapToResponse);
    }

    public async Task<WebsiteContentResponse?> GetContentByKeyAsync(string key)
    {
        var content = await _db.WebsiteContents.FirstOrDefaultAsync(w => w.Key == key);
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
        return MapToResponse(existing);
    }

    /// <summary>
    /// Các key nội dung là Ô ẢNH trên landing page — chỉ key này mới nhận upload,
    /// tránh ghi đè key văn bản tùy ý (vd "HeroTitle") bằng đường dẫn file.
    /// </summary>
    private static readonly string[] ImageKeys =
    {
        "SiteLogo",       // logo header + footer
        "HeroBannerUrl",  // ảnh banner hero
        "StoryImage",     // ảnh mục câu chuyện
        "CultureImage"    // ảnh mục văn hóa
    };

    public async Task<string> UploadImageAsync(Stream imageStream, string fileName, string contentKey)
    {
        if (string.IsNullOrWhiteSpace(contentKey) || !ImageKeys.Contains(contentKey, StringComparer.OrdinalIgnoreCase))
            throw new ArgumentException($"Key ảnh không hợp lệ: {contentKey}");

        // Chuẩn hóa về ĐÚNG key trong whitelist trước khi ghi DB: so khớp không phân
        // biệt hoa/thường nhưng ghi key nguyên bản thì "herobannerurl" tạo row riêng,
        // còn Landing Page chỉ đọc "HeroBannerUrl" → ảnh không bao giờ hiển thị.
        var canonicalKey = ImageKeys.First(k => k.Equals(contentKey, StringComparison.OrdinalIgnoreCase));

        var wwwroot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var contentDir = Path.Combine(wwwroot, "uploads", "content", canonicalKey.ToLowerInvariant());
        Directory.CreateDirectory(contentDir);

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
        if (!string.IsNullOrWhiteSpace(oldRelativePath)
            && oldRelativePath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
            && !oldRelativePath.Contains("..", StringComparison.Ordinal))
        {
            var oldFilePath = Path.Combine(wwwroot,
                oldRelativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (!string.Equals(oldFilePath, filePath, StringComparison.OrdinalIgnoreCase) && File.Exists(oldFilePath))
            {
                try { File.Delete(oldFilePath); }
                catch { /* file đang bị mở hoặc đã bị dọn trước đó — bỏ qua */ }
            }
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
