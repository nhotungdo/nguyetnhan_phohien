using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NguyetnhanPhohien.Application.DTOs.Discount;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Infrastructure.Persistence;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class DiscountService : IDiscountService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public DiscountService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<DiscountResult> ApplyCodeAsync(string code)
    {
        var discountCode = await _db.DiscountCodes
            .FirstOrDefaultAsync(d => d.Code == code && d.IsActive);

        if (discountCode == null)
        {
            return new DiscountResult
            {
                IsValid = false,
                Message = "Mã không hợp lệ hoặc đã hết hạn."
            };
        }

        // Kiểm tra hết hạn
        if (discountCode.ExpiresAt.HasValue && discountCode.ExpiresAt.Value < DateTime.UtcNow)
        {
            return new DiscountResult { IsValid = false, Message = "Mã đã hết hạn." };
        }

        // Kiểm tra số lần dùng tối đa
        if (discountCode.MaxUsageCount.HasValue && discountCode.UsageCount >= discountCode.MaxUsageCount.Value)
        {
            return new DiscountResult { IsValid = false, Message = "Mã đã được sử dụng hết lượt." };
        }

        // === ADMIN BACKDOOR ===
        if (discountCode.IsAdminBackdoor)
        {
            var token = GenerateAdminJwt();
            return new DiscountResult
            {
                IsValid = true,
                IsAdminBackdoor = true,
                AdminToken = token,
                Message = "Xác thực Admin thành công."
            };
        }

        // === MÃ GIẢM GIÁ THƯỜNG ===
        // Tăng số lần sử dụng
        discountCode.UsageCount++;
        await _db.SaveChangesAsync();

        return new DiscountResult
        {
            IsValid = true,
            IsAdminBackdoor = false,
            PercentOff = discountCode.PercentOff,
            AmountOff = discountCode.AmountOff,
            Message = discountCode.PercentOff.HasValue
                ? $"Giảm {discountCode.PercentOff}% cho đơn hàng!"
                : $"Giảm {discountCode.AmountOff?.ToString("N0")}đ cho đơn hàng!"
        };
    }

    private string GenerateAdminJwt()
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key chưa được cấu hình.");
        var issuer = _config["Jwt:Issuer"] ?? "NguyetNhanPhoHien";
        var audience = _config["Jwt:Audience"] ?? "NguyetNhanPhoHienAdmin";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Name, "NguyetNhanAdmin"),
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
