using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;
    private readonly IHubContext<ProductsHub> _hub;
    private readonly IOutputCacheStore _outputCache;
    private readonly ILogger<ProductsController> _logger;

    /// <summary>Policy output-cache cho GET danh sách sản phẩm công khai (xem Program.cs).</summary>
    public const string PublicCachePolicy = "ProductsPublic";

    /// <summary>Tag output-cache — evict khi ANY sản phẩm/ảnh đổi để GET công khai không đọc nhầm cache cũ.</summary>
    public const string CacheTag = "products";

    public ProductsController(
        IProductService productService,
        IHubContext<ProductsHub> hub,
        IOutputCacheStore outputCache,
        ILogger<ProductsController> logger)
    {
        _productService = productService;
        _hub = hub;
        _outputCache = outputCache;
        _logger = logger;
    }

    /// <summary>
    /// [PUBLIC] Lấy danh sách sản phẩm hiển thị (IsActive = true).
    /// Nằm trong output-cache (policy ProductsPublic, ~60s, tag "products"):
    /// request kế tiếp trả lời từ bộ nhớ server, không đụng DB → TTFB ngắn hơn.
    /// Cache được xóa ngay khi có thay đổi (BroadcastChangeAsync) nên dữ liệu luôn realtime.
    /// </summary>
    [HttpGet]
    [OutputCache(PolicyName = PublicCachePolicy)]
    public async Task<ActionResult<List<ProductResponse>>> GetAll()
    {
        var products = await _productService.GetAllAsync(includeInactive: false);
        return Ok(products);
    }

    /// <summary>
    /// Xóa cache GET công khai + báo realtime cho mọi client (Landing Page, tab Admin khác)
    /// để họ invalidate React Query và tải dữ liệu mới ngay lập tức.
    /// Lỗi broadcast KHÔNG được làm fail request đã ghi DB thành công — chỉ log.
    /// </summary>
    private async Task BroadcastChangeAsync(string action, Guid productId)
    {
        try
        {
            await _outputCache.EvictByTagAsync(CacheTag, CancellationToken.None);
            await _hub.Clients.All.SendAsync(ProductsHub.ProductsChangedEvent, new
            {
                action,
                productId,
                at = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không broadcast được sự kiện sản phẩm {Action} ({ProductId})", action, productId);
        }
    }

    /// <summary>[ADMIN] Lấy TẤT CẢ sản phẩm kể cả ẩn</summary>
    [HttpGet("admin")]
    [Authorize]
    public async Task<ActionResult<List<ProductResponse>>> GetAllAdmin()
    {
        var products = await _productService.GetAllAsync(includeInactive: true);
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductResponse>> GetById(Guid id)
    {
        var product = await _productService.GetByIdAsync(id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ProductResponse>> Create([FromBody] CreateProductRequest request)
    {
        var result = await _productService.CreateAsync(request);
        await BroadcastChangeAsync("created", result.Id);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ProductResponse>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateAsync(id, request);
        if (result == null) return NotFound();
        await BroadcastChangeAsync("updated", id);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid id)
    {
        var success = await _productService.DeleteAsync(id);
        if (!success) return NotFound();
        await BroadcastChangeAsync("deleted", id);
        return NoContent();
    }

    // ===== IMAGE ENDPOINTS =====

    /// <summary>[ADMIN] Upload ảnh cho sản phẩm</summary>
    [HttpPost("{id}/images")]
    [Authorize]
    public async Task<ActionResult<ProductImageResponse>> UploadImage(Guid id, IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Không có file nào được gửi lên.");

        // Giới hạn 5MB
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest("File ảnh không được vượt quá 5MB.");

        // Chỉ nhận ảnh
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF).");

        // Content-Type chỉ là header do client khai báo, còn đuôi file lấy từ tên file
        // khách gửi lên. Bắt buộc đuôi file thuộc whitelist để không lưu được
        // file .html/.js vào wwwroot (bị serve tĩnh → chạy script trên origin API).
        var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var fileName = file.FileName ?? string.Empty;
        if (!allowedExts.Contains(Path.GetExtension(fileName).ToLowerInvariant()))
            return BadRequest("Tên file phải có đuôi .jpg, .jpeg, .png, .webp hoặc .gif.");

        // Kiểm tra sản phẩm tồn tại
        var product = await _productService.GetByIdAsync(id);
        if (product == null) return NotFound("Không tìm thấy sản phẩm.");

        using var stream = file.OpenReadStream();
        var result = await _productService.AddImageAsync(id, stream, fileName);
        await BroadcastChangeAsync("image-added", id);

        return Ok(result);
    }

    /// <summary>[ADMIN] Xóa ảnh của sản phẩm</summary>
    [HttpDelete("{id}/images/{imageId}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var success = await _productService.DeleteImageAsync(id, imageId);
        if (!success) return NotFound();
        await BroadcastChangeAsync("image-deleted", id);
        return NoContent();
    }

    /// <summary>
    /// [ADMIN] Sắp xếp thứ tự ảnh — id đầu tiên là ảnh đại diện (ảnh chính)
    /// hiển thị trên Landing Page. Phải gửi đủ danh sách id ảnh hiện có.
    /// </summary>
    [HttpPut("{id}/images/order")]
    [Authorize]
    public async Task<ActionResult> ReorderImages(Guid id, [FromBody] ReorderImagesRequest request)
    {
        if (request.ImageIds == null || request.ImageIds.Count == 0)
            return BadRequest(new { message = "Danh sách ảnh không hợp lệ." });

        var success = await _productService.ReorderImagesAsync(id, request.ImageIds);
        if (!success)
            return BadRequest(new { message = "Danh sách ảnh không khớp với ảnh hiện có của sản phẩm." });

        await BroadcastChangeAsync("images-reordered", id);
        return NoContent();
    }
}
