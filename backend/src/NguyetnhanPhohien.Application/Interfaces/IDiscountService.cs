using NguyetnhanPhohien.Application.DTOs.Discount;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IDiscountService
{
    Task<DiscountResult> ApplyCodeAsync(string code);
    Task<List<DiscountDto>> GetAllAsync();
    Task<DiscountDto?> GetByIdAsync(Guid id);
    Task<DiscountDto> CreateAsync(CreateDiscountRequest request);
    Task<DiscountDto> UpdateAsync(Guid id, UpdateDiscountRequest request);
    Task<bool> DeleteAsync(Guid id);
}
