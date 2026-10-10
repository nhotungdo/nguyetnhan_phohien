using NguyetnhanPhohien.Application.DTOs.Discount;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IDiscountService
{
    /// <summary>
    /// Kiểm tra mã giảm giá. Truyền kèm số điện thoại để báo sớm trường hợp
    /// SĐT này đã dùng mã rồi (mỗi SĐT chỉ dùng một mã đúng một lần).
    /// </summary>
    Task<DiscountResult> ApplyCodeAsync(string code, string? customerPhone = null);
    Task<List<DiscountDto>> GetAllAsync();
    Task<DiscountDto?> GetByIdAsync(Guid id);
    Task<DiscountDto> CreateAsync(CreateDiscountRequest request);
    Task<DiscountDto> UpdateAsync(Guid id, UpdateDiscountRequest request);
    Task<bool> DeleteAsync(Guid id);
}
