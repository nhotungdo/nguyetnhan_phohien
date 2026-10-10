using Microsoft.AspNetCore.Authorization;
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
    /// </summary>
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyCode([FromBody] ApplyDiscountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
            return BadRequest(new { message = "Vui lòng nhập mã." });

        var result = await _discountService.ApplyCodeAsync(request.Code.Trim(), request.CustomerPhone);

        if (!result.IsValid)
            return BadRequest(new { message = result.Message });

        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _discountService.GetAllAsync();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _discountService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDiscountRequest request)
    {
        try
        {
            var result = await _discountService.CreateAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDiscountRequest request)
    {
        try
        {
            var result = await _discountService.UpdateAsync(id, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _discountService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
