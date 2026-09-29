using NguyetnhanPhohien.Application.DTOs.Discount;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IDiscountService
{
    Task<DiscountResult> ApplyCodeAsync(string code);
}
