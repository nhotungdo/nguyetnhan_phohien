using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NguyetnhanPhohien.Application.DTOs.Auth;
using NguyetnhanPhohien.Application.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly IConfiguration _config;

    public AuthService(IConfiguration config)
    {
        _config = config;
    }

    public Task<AdminLoginResponse> AdminLoginAsync(AdminLoginRequest request)
    {
        // Thông tin đăng nhập duy nhất nằm trong cấu hình (user-secrets / biến môi trường),
        // KHÔNG nằm trong source code hay database mà khách hàng có thể chạm tới.
        var adminUsername = _config["Admin:Username"];
        var adminPassword = _config["Admin:Password"];

        if (string.IsNullOrEmpty(adminUsername) || string.IsNullOrEmpty(adminPassword))
            throw new InvalidOperationException(
                "Admin:Username / Admin:Password chưa được cấu hình (dùng user-secrets hoặc biến môi trường).");

        // So sánh_CONSTANT-TIME để chống timing attack
        var userOk = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(request.Username ?? string.Empty),
            Encoding.UTF8.GetBytes(adminUsername));
        var passOk = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(request.Password ?? string.Empty),
            Encoding.UTF8.GetBytes(adminPassword));

        if (!userOk || !passOk)
            throw new UnauthorizedAccessException("Tên đăng nhập hoặc mật khẩu không đúng.");

        return Task.FromResult(new AdminLoginResponse
        {
            Token = GenerateAdminJwt(adminUsername),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            Username = adminUsername
        });
    }

    private string GenerateAdminJwt(string username)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key chưa được cấu hình.");
        var issuer = _config["Jwt:Issuer"] ?? "NguyetNhanPhoHien";
        var audience = _config["Jwt:Audience"] ?? "NguyetNhanPhoHienAdmin";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Name, username),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
