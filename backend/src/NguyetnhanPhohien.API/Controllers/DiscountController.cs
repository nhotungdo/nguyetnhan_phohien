using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Discount;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountController : ControllerBase
{
    private readonly IDiscountService _discountService;

    public DiscountController(IDiscountService discountService)
    {
        _discountService = discountService;
    }

    /// <summary>
    /// Xác thực mã giảm giá.
    /// Nếu là mã Admin backdoor -> trả về JWT token để truy cập dashboard.
    /// Nếu là mã thường -> trả về thông tin giảm giá.
    /// </summary>
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyCode([FromBody] ApplyDiscountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Vui lòng nhập mã." });

        var result = await _discountService.ApplyCodeAsync(request.Code.Trim());

        if (!result.IsValid)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }
}
