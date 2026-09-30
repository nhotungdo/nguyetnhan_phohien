using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Auth;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// [PUBLIC] Đăng nhập admin bằng username/password.
    /// Trả về JWT (role Admin) dùng cho mọi API quản trị và ChatHub.
    /// </summary>
    [HttpPost("admin-login")]
    [AllowAnonymous]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest request)
    {
        try
        {
            var result = await _authService.AdminLoginAsync(request);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            // Không tiết lộ lỗi nào sai (user hay password)
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
        }
    }

    /// <summary>
    /// [ADMIN] Kiểm tra token còn hiệu lực.
    /// </summary>
    [HttpGet("me")]
    [Authorize(Roles = "Admin")]
    public IActionResult Me()
    {
        return Ok(new
        {
            username = User.Identity?.Name ?? "Admin",
            authenticated = true
        });
    }
}
