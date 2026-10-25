using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.CustomMix;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/custom-mix")]
public class CustomMixController : ControllerBase
{
    private readonly ICustomMixService _customMixService;

    public CustomMixController(ICustomMixService customMixService)
    {
        _customMixService = customMixService;
    }

    /// <summary>
    /// [PUBLIC] Lấy danh sách quy cách đóng gói (150g, 300g, 900g) và 6 loại hạt đặc sản đang mở bán
    /// </summary>
    [HttpGet("options")]
    public async Task<ActionResult<CustomMixOptionsResponse>> GetOptions()
    {
        var options = await _customMixService.GetOptionsAsync();
        return Ok(options);
    }

    /// <summary>
    /// [PUBLIC] Kiểm tra tính hợp lệ của công thức tự chọn hạt và tính giá trọn gói niêm yết
    /// </summary>
    [HttpPost("validate")]
    public async Task<ActionResult<ValidateCustomMixResponse>> ValidateMix([FromBody] ValidateCustomMixRequest request)
    {
        var result = await _customMixService.ValidateMixAsync(request);
        return Ok(result);
    }
}
