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
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpsertContent([FromBody] UpdateContentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Key) || string.IsNullOrWhiteSpace(request.Value))
            return BadRequest(new { message = "Key và Value không được để trống." });

        var result = await _contentService.UpsertContentAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// [ADMIN] Upload ảnh banner trực tiếp từ thiết bị.
    /// Lưu ảnh vào wwwroot/uploads/banners và tự động cập nhật key HeroBannerUrl.
    /// </summary>
    [HttpPost("upload-banner")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadBannerImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Không có file nào được gửi lên." });

        if (file.Length > 10 * 1024 * 1024)
            return BadRequest(new { message = "File ảnh không được vượt quá 10MB." });

        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)." });

        using var stream = file.OpenReadStream();
        var path = await _contentService.UploadBannerImageAsync(stream, file.FileName);
        return Ok(new { imagePath = path, message = "Upload banner thành công!" });
    }
}

