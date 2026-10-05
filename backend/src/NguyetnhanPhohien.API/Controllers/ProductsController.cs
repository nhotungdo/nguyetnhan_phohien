using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>[PUBLIC] Lấy danh sách sản phẩm hiển thị (IsActive = true)</summary>
    [HttpGet]
    public async Task<ActionResult<List<ProductResponse>>> GetAll()
    {
        var products = await _productService.GetAllAsync(includeInactive: false);
        return Ok(products);
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
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ProductResponse>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await _productService.UpdateAsync(id, request);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult> Delete(Guid id)
    {
        var success = await _productService.DeleteAsync(id);
        if (!success) return NotFound();
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

        return Ok(result);
    }

    /// <summary>[ADMIN] Xóa ảnh của sản phẩm</summary>
    [HttpDelete("{id}/images/{imageId}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(Guid id, Guid imageId)
    {
        var success = await _productService.DeleteImageAsync(id, imageId);
        if (!success) return NotFound();
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

        return NoContent();
    }
}
