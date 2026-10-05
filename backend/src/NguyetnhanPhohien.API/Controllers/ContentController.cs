using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Content;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;

    public ContentController(IContentService contentService)
    {
        _contentService = contentService;
    }

    /// <summary>
    /// [PUBLIC] Lấy toàn bộ nội dung để hiển thị trên Landing Page.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllContent()
    {
        var content = await _contentService.GetAllContentAsync();
        return Ok(content);
    }

    /// <summary>
    /// [PUBLIC] Lấy nội dung theo key cụ thể.
    /// </summary>
    [HttpGet("{key}")]
    public async Task<IActionResult> GetContentByKey(string key)
    {
        var content = await _contentService.GetContentByKeyAsync(key);
        if (content == null) return NotFound(new { message = $"Không tìm thấy nội dung với key: {key}" });
        return Ok(content);
    }

    /// <summary>
    /// [ADMIN] Cập nhật nội dung website (ảnh, text...).
    /// Dùng Upsert: nếu key chưa có thì tạo mới, đã có thì cập nhật.
    /// Chỉ Key là bắt buộc — Value được phép rỗng để admin xóa nội dung trên Landing Page.
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpsertContent([FromBody] UpdateContentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Key))
            return BadRequest(new { message = "Key không được để trống." });

        // JSON có thể gửi "value": null → chuẩn hóa về rỗng để không ghi null vào cột NOT NULL.
        if (request.Value is null)
            request.Value = string.Empty;

        var result = await _contentService.UpsertContentAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// [ADMIN] Ảnh upload từ thiết bị cho một slot ảnh của Landing Page
    /// (SiteLogo, HeroBannerUrl, StoryImage, CultureImage — backend whitelist key).
    /// Lưu vào wwwroot/uploads/content/{key} và tự cập nhật key nội dung tương ứng.
    /// </summary>
    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage([FromQuery] string key, IFormFile file)
    {
        if (string.IsNullOrWhiteSpace(key))
            return BadRequest(new { message = "Thiếu key ảnh cần cập nhật." });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { message = "File ảnh không được vượt quá 10MB." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)." });

        // Content-Type chỉ là header do client khai báo, còn đuôi file lấy từ tên file
        // khách gửi lên. Bắt buộc đuôi file thuộc whitelist để không lưu được
        // file .html/.js vào wwwroot (bị serve tĩnh → chạy script trên origin API).
        var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var fileName = file.FileName ?? string.Empty;
        if (!allowedExts.Contains(Path.GetExtension(fileName).ToLowerInvariant()))
            return BadRequest(new { message = "Tên file phải có đuôi .jpg, .jpeg, .png, .webp hoặc .gif." });

        try
        {
            using var stream = file.OpenReadStream();
            var path = await _contentService.UploadImageAsync(stream, fileName, key);
            return Ok(new { imagePath = path, message = "Upload ảnh thành công!" });
        }
        catch (ArgumentException ex)
        {
            // Key ngoài whitelist (không phải ô ảnh) → thông báo rõ, không ghi gì
            return BadRequest(new { message = ex.Message });
        }
    }
}

