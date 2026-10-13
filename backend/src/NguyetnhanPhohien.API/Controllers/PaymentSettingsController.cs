using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Payment;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

/// <summary>
/// [ADMIN] Thông tin nhận thanh toán (VietQR) in trong email hóa đơn.
/// Chủ shop sửa trong trang quản trị /payment — không cần build lại hay đụng appsettings.
///
/// Cả hai endpoint đều chỉ dành cho Admin: số tài khoản không phải bí mật (nó in trên
/// mọi hóa đơn) nhưng không cần phơi ra bề mặt công khai, và chỉ admin mới được GHI.
/// </summary>
[ApiController]
[Route("api/payment-settings")]
public class PaymentSettingsController : ControllerBase
{
    private readonly IPaymentSettingsService _paymentSettings;

    public PaymentSettingsController(IPaymentSettingsService paymentSettings)
    {
        _paymentSettings = paymentSettings;
    }

    /// <summary>[ADMIN] Lấy cấu hình nhận thanh toán hiện tại.</summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Get()
    {
        var settings = await _paymentSettings.GetAsync();
        return Ok(settings);
    }

    /// <summary>
    /// [ADMIN] Cập nhật cấu hình nhận thanh toán.
    /// Trả { message } khi dữ liệu không hợp lệ để trang quản trị hiện đúng nguyên nhân.
    /// </summary>
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update([FromBody] UpdatePaymentSettingsRequest request)
    {
        try
        {
            var settings = await _paymentSettings.UpdateAsync(request);
            return Ok(settings);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
