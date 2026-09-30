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
}
