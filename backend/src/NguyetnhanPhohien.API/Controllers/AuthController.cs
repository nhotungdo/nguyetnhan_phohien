using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NguyetnhanPhohien.Application.DTOs.Auth;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    /// <summary>Tên policy rate-limit cho đăng nhập (khai báo trong Program.cs).</summary>
    public const string AdminLoginRateLimitPolicy = "admin-login";

    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>IP gọi request — dùng cho log, không phải dữ liệu bảo mật.</summary>
    private string ClientIp => HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

    /// <summary>
    /// [PUBLIC] Đăng nhập admin bằng username/password.
    /// Trả về JWT (role Admin) dùng cho mọi API quản trị và ChatHub.
    /// </summary>
    // Rate limit theo IP (5 lần / 5 phút) — xem Program.cs. Đặt ở đây vì đây là
    // endpoint duy nhất kiểm tra mật khẩu admin.
    [HttpPost("admin-login")]
    [AllowAnonymous]
    [EnableRateLimiting(AdminLoginRateLimitPolicy)]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest request)
    {
        var username = request.Username ?? string.Empty;

        try
        {
            var result = await _authService.AdminLoginAsync(request);

            // Trang đăng nhập ghi "Mọi truy cập được ghi log" nhưng trước đây KHÔNG có
            // dòng log nào — cả thành công lẫn thất bại đều im lặng. Ghi lại để có dấu
            // vết khi bị dò mật khẩu. KHÔNG bao giờ log mật khẩu.
            _logger.LogInformation(
                "Đăng nhập admin THÀNH CÔNG: username={Username}, ip={Ip}", username, ClientIp);

            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            _logger.LogWarning(
                "Đăng nhập admin THẤT BẠI: username={Username}, ip={Ip}", username, ClientIp);

            // Không tiết lộ lỗi nào sai (user hay password)
            return Unauthorized(new { message = "Tên đăng nhập hoặc mật khẩu không đúng." });
        }
        catch (InvalidOperationException ex)
        {
            // Thiếu cấu hình (Admin:Username/Password, Jwt:Key...) — trả thông báo
            // đúng nguyên nhân thay vì 500 chung chung để trang đăng nhập hiện
            // "API Error 500" không rõ lý do. Không lộ giá trị secret nào.
            _logger.LogError(ex, "Đăng nhập admin không thực hiện được do thiếu cấu hình.");
            return StatusCode(500, new { message = ex.Message });
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
