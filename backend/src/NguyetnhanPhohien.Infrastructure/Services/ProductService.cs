using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NguyetnhanPhohien.Application.DTOs.Products;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;
    private readonly string _uploadsPath;

    public ProductService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        // Lấy đường dẫn uploads từ config (nếu có); mặc định là wwwroot của API
        var configuredPath = config["FileStorage:UploadsPath"];
        var basePath = string.IsNullOrWhiteSpace(configuredPath)
            ? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            : configuredPath;
        _uploadsPath = Path.Combine(basePath, "uploads", "products");
        Directory.CreateDirectory(_uploadsPath);
    }

    public async Task<List<ProductResponse>> GetAllAsync(bool includeInactive = false)
    {
        var query = _db.Products.Include(p => p.Images).AsQueryable();

        if (!includeInactive)
            query = query.Where(p => p.IsActive);

        var products = await query.OrderBy(p => p.DisplayOrder).ThenBy(p => p.Name).ToListAsync();
        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponse?> GetByIdAsync(Guid id)
    {
        var product = await _db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);
        return product == null ? null : MapToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var product = new Product
        {
            Name = request.Name,
            Price = request.Price,
            Size = request.Size,
            Description = request.Description,
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

        product.Name = request.Name;
        product.Price = request.Price;
        product.Size = request.Size;
        product.Description = request.Description;
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

        // Xóa file ảnh khỏi disk
        foreach (var img in product.Images)
        {
            var filePath = Path.Combine(_uploadsPath, Path.GetFileName(img.ImagePath));
            if (File.Exists(filePath)) File.Delete(filePath);
        }

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();
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
            ImagePath = $"/uploads/products/{uniqueFileName}",
            DisplayOrder = (maxOrder ?? -1) + 1,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProductImages.Add(image);
        await _db.SaveChangesAsync();

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

        // Xóa file
        var filePath = Path.Combine(_uploadsPath, Path.GetFileName(image.ImagePath));
        if (File.Exists(filePath)) File.Delete(filePath);

        _db.ProductImages.Remove(image);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderImagesAsync(Guid productId, IReadOnlyList<Guid> orderedImageIds)
    {
        var images = await _db.ProductImages
            .Where(pi => pi.ProductId == productId)
            .ToListAsync();

        if (images.Count == 0) return false;

        // Phải gửi ĐỦ id ảnh của sản phẩm, không trùng, không id lạ —
        // tránh ghi đè DisplayOrder bằng danh sách thiếu/thừa làm thứ tự ảnh hỗn độn.
        if (orderedImageIds.Count != images.Count
            || orderedImageIds.Distinct().Count() != orderedImageIds.Count)
            return false;

        var imageSet = images.Select(i => i.Id).ToHashSet();
        if (orderedImageIds.Any(id => !imageSet.Contains(id))) return false;

        for (var i = 0; i < orderedImageIds.Count; i++)
        {
            images.First(x => x.Id == orderedImageIds[i]).DisplayOrder = i;
        }

        await _db.SaveChangesAsync();
        return true;
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            Name = product.Name,
            Price = product.Price,
            Size = product.Size,
            Description = product.Description,
            IsActive = product.IsActive,
            DisplayOrder = product.DisplayOrder,
            Images = product.Images
                .OrderBy(i => i.DisplayOrder)
                .Select(i => new ProductImageResponse
                {
                    Id = i.Id,
                    ImagePath = i.ImagePath,
                    DisplayOrder = i.DisplayOrder
                })
                .ToList()
        };
    }
}
