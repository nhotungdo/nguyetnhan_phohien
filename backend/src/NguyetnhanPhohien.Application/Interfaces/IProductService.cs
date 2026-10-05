using NguyetnhanPhohien.Application.DTOs.Products;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IProductService
{
    Task<List<ProductResponse>> GetAllAsync(bool includeInactive = false);
    Task<ProductResponse?> GetByIdAsync(Guid id);
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
    Task<ProductResponse?> UpdateAsync(Guid id, UpdateProductRequest request);
    Task<bool> DeleteAsync(Guid id);

    // Image management
    Task<ProductImageResponse> AddImageAsync(Guid productId, Stream imageStream, string fileName);
    Task<bool> DeleteImageAsync(Guid productId, Guid imageId);

    /// <summary>
    /// Sắp xếp lại thứ tự ảnh của sản phẩm (vd: đặt ảnh chính lên đầu —
    /// ảnh(DisplayOrder nhỏ nhất) chính là ảnh đại diện trên landing page).
    /// Danh sách phải chứa ĐỦ các id ảnh hiện có của sản phẩm.
    /// </summary>
    Task<bool> ReorderImagesAsync(Guid productId, IReadOnlyList<Guid> orderedImageIds);
}
