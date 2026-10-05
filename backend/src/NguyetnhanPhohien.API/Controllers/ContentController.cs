using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Content;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly IContentService _contentService;
    private readonly IHubContext<ProductsHub> _hub;
    private readonly IOutputCacheStore _outputCache;
    private readonly ILogger<ContentController> _logger;

    /// <summary>Policy output-cache cho GET toàn bộ nội dung công khai (xem Program.cs).</summary>
    public const string PublicCachePolicy = "ContentPublic";

    /// <summary>Tag output-cache — evict khi nội dung/ảnh Landing Page đổi.</summary>
    public const string CacheTag = "content";

    public ContentController(
        IContentService contentService,
        IHubContext<ProductsHub> hub,
        IOutputCacheStore outputCache,
        ILogger<ContentController> logger)
    {
        _contentService = contentService;
        _hub = hub;
        _outputCache = outputCache;
        _logger = logger;
    }

    /// <summary>
    /// [PUBLIC] Lấy toàn bộ nội dung để hiển thị trên Landing Page.
    /// Nằm trong output-cache (policy ContentPublic, tag "content") để trả lời từ
    /// bộ nhớ server thay vì truy vấn DB mỗi lần tải trang; cache tự xóa ngay khi
    /// admin lưu (BroadcastChangeAsync) nên không bao giờ trả nội dung cũ.
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = PublicCachePolicy)]
    public async Task<IActionResult> GetAllContent()
    {
        var content = await _contentService.GetAllContentAsync();
        return Ok(content);
    }

    /// <summary>
    /// Xóa cache GET nội dung + báo realtime để Landing Page / tab Admin khác
    /// invalidate React Query và hiển thị text/ảnh mới ngay (kể cả ảnh CMS
    /// như HeroBanner, Logo, Story, Culture).
    /// Lỗi broadcast KHÔNG làm fail request đã ghi DB thành công — chỉ log.
    /// </summary>
    private async Task BroadcastContentChangedAsync(string key)
    {
        try
        {
            await _outputCache.EvictByTagAsync(CacheTag, CancellationToken.None);
            await _hub.Clients.All.SendAsync(ProductsHub.ContentChangedEvent, new
            {
                key,
                at = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không broadcast được sự kiện nội dung {Key}", key);
        }
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
        await BroadcastContentChangedAsync(request.Key);
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
            await BroadcastContentChangedAsync(key);
            return Ok(new { imagePath = path, message = "Upload ảnh thành công!" });
        }
        catch (ArgumentException ex)
        {
            // Key ngoài whitelist (không phải ô ảnh) → thông báo rõ, không ghi gì
            return BadRequest(new { message = ex.Message });
        }
    }
}

