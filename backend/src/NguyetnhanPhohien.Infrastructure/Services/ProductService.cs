using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ProductService : IProductService
{
    /// <summary>Tiền tố URL công khai, khớp thư mục con dưới wwwroot.</summary>
    private const string PublicUrlPrefix = "/uploads/products";

    private readonly AppDbContext _db;
    private readonly string _uploadsPath;

    public ProductService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;

        // MỘT nguồn duy nhất cho gốc lưu ảnh (xem UploadPathResolver). Ghi vào đúng
        // thư mục mà UseStaticFiles phục vụ tại /uploads ⇒ URL công khai luôn khớp
        // đường dẫn trên đĩa, không còn cảnh ảnh ghi được nhưng request trả 404.
        _uploadsPath = UploadPathResolver.Directory(env, "uploads", "products");
    }

    public async Task<List<ProductResponse>> GetAllAsync(bool includeInactive = false)
    {
        var query = _db.Products.AsNoTracking().Include(p => p.Images).AsQueryable();

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        var products = await query.OrderBy(p => p.DisplayOrder).ThenBy(p => p.Name).ToListAsync();
        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponse?> GetByIdAsync(Guid id)
    {
        var product = await _db.Products.AsNoTracking().Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);
        return product == null ? null : MapToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var product = new Product
        {
            ProductCode = request.ProductCode,
            Name = request.Name,
            NameEn = request.NameEn,
            PackagingType = request.PackagingType,
            Price = request.Price,
            Size = request.Size,
            Badge = request.Badge,
            Description = request.Description,
            Overview = request.Overview,
            Ingredients = request.Ingredients,
            SensoryScores = request.SensoryScores,
            HealthBenefits = request.HealthBenefits,
            UsageInstructions = request.UsageInstructions,
            IsActive = request.IsActive,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return MapToResponse(product);
    }

    public async Task<ProductResponse?> UpdateAsync(Guid id, UpdateProductRequest request)
    {
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        product.ProductCode = request.ProductCode;
        product.Name = request.Name;
        product.NameEn = request.NameEn;
        product.PackagingType = request.PackagingType;
        product.Price = request.Price;
        product.Size = request.Size;
        product.Badge = request.Badge;
        product.Description = request.Description;
        product.Overview = request.Overview;
        product.Ingredients = request.Ingredients;
        product.SensoryScores = request.SensoryScores;
        product.HealthBenefits = request.HealthBenefits;
        product.UsageInstructions = request.UsageInstructions;
        product.IsActive = request.IsActive;
        product.DisplayOrder = request.DisplayOrder;
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(product);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return false;

        // LƯU DB TRƯỚC, xoá file SAU. Thứ tự cũ (xoá file trước khi SaveChanges) khiến
        // một lỗi DB để lại row trỏ tới file đã mất → ảnh 404 vĩnh viễn dù đơn/DB còn.
        // Đảo lại thì lỗi DB không gây hại, còn tệ nhất chỉ dư file rác trên đĩa.
        var imagePaths = product.Images.Select(img => img.ImagePath).ToList();

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        foreach (var imagePath in imagePaths)
        {
            var filePath = Path.Combine(_uploadsPath, Path.GetFileName(imagePath));
            if (File.Exists(filePath)) File.Delete(filePath);
        }

        return true;
    }

    public async Task<ProductImageResponse> AddImageAsync(Guid productId, Stream imageStream, string fileName)
    {
        // Tạo tên file unique để tránh trùng
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        var uniqueFileName = $"{productId}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(_uploadsPath, uniqueFileName);

        using (var fs = File.Create(filePath))
        {
            await imageStream.CopyToAsync(fs);
        }

        // Lấy DisplayOrder lớn nhất hiện có — KHÔNG dùng Count: sau khi xóa ảnh ở giữa
        // danh sách, Count sẽ trùng thứ tự với ảnh còn lại và thứ tự hiển thị không xác định.
        var maxOrder = await _db.ProductImages
            .Where(pi => pi.ProductId == productId)
            .MaxAsync(pi => (int?)pi.DisplayOrder);

        var image = new ProductImage
        {
            ProductId = productId,
            ImagePath = $"{PublicUrlPrefix}/{uniqueFileName}",
            DisplayOrder = (maxOrder ?? -1) + 1,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProductImages.Add(image);

        // Ghi DB lỗi thì dọn ngay file vừa tạo: nếu không, mỗi lần lỗi để lại một
        // file rác vĩnh viễn trong wwwroot mà không row nào trỏ tới.
        try
        {
            await _db.SaveChangesAsync();
        }
        catch
        {
            _db.Entry(image).State = EntityState.Detached;
            try { if (File.Exists(filePath)) File.Delete(filePath); }
            catch { /* không xoá được file thì thôi, lỗi gốc vẫn được ném ra */ }
            throw;
        }

        return new ProductImageResponse
        {
            Id = image.Id,
            ImagePath = image.ImagePath,
            DisplayOrder = image.DisplayOrder
        };
    }

    public async Task<bool> DeleteImageAsync(Guid productId, Guid imageId)
    {
        var image = await _db.ProductImages
            .FirstOrDefaultAsync(pi => pi.Id == imageId && pi.ProductId == productId);
        if (image == null) return false;

        // LƯU DB TRƯỚC, xoá file SAU — xem giải thích ở DeleteAsync.
        var filePath = Path.Combine(_uploadsPath, Path.GetFileName(image.ImagePath));

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync();

        if (File.Exists(filePath)) File.Delete(filePath);
        return true;
    }

    public async Task<bool> ReorderImagesAsync(Guid productId, IReadOnlyList<Guid> orderedImageIds)
    {
        var images = await _db.ProductImages
            .Where(pi => pi.ProductId == productId)
            .ToListAsync();

        if (images.Count == 0) return true;
        if (orderedImageIds == null || orderedImageIds.Count == 0) return true;

        var existingMap = images.ToDictionary(i => i.Id);
        var order = 0;

        // Ưu tiên xếp thứ tự các ảnh được truyền vào (ảnh đầu tiên có DisplayOrder = 0 làm ảnh chính)
        foreach (var id in orderedImageIds)
        {
            if (existingMap.TryGetValue(id, out var img))
            {
                img.DisplayOrder = order++;
                existingMap.Remove(id);
            }
        }

        // Bổ sung các ảnh còn lại nếu có vào sau
        foreach (var remaining in existingMap.Values.OrderBy(i => i.DisplayOrder))
        {
            remaining.DisplayOrder = order++;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductResponse MapToResponse(Product product)
    {
        var images = product.Images != null && product.Images.Count > 0
            ? product.Images
                .OrderBy(i => i.DisplayOrder)
                .Select(i => new ProductImageResponse
                {
                    Id = i.Id,
                    ImagePath = i.ImagePath,
                    DisplayOrder = i.DisplayOrder
                })
                .ToList()
            : !string.IsNullOrWhiteSpace(product.ImageUrl)
                ? new List<ProductImageResponse>
                {
                    new()
                    {
                        Id = product.Id,
                        ImagePath = product.ImageUrl,
                        DisplayOrder = 0
                    }
                }
                : new List<ProductImageResponse>();

        var primaryImage = images.FirstOrDefault()?.ImagePath ?? product.ImageUrl;

        return new ProductResponse
        {
            Id = product.Id,
            ProductCode = product.ProductCode,
            Name = product.Name,
            NameEn = product.NameEn,
            PackagingType = product.PackagingType,
            Price = product.Price,
            Size = product.Size,
            Badge = product.Badge,
            Description = product.Description,
            Overview = product.Overview,
            Ingredients = product.Ingredients,
            SensoryScores = product.SensoryScores,
            HealthBenefits = product.HealthBenefits,
            UsageInstructions = product.UsageInstructions,
            ImageUrl = primaryImage,
            IsActive = product.IsActive,
            DisplayOrder = product.DisplayOrder,
            Images = images
        };
    }
}
