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

    public async Task<List<DiscountDto>> GetAllAsync()
    {
        return await _db.DiscountCodes
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new DiscountDto
            {
                Id = d.Id,
                Code = d.Code,
                PercentOff = d.PercentOff,
                AmountOff = d.AmountOff,
                IsAdminBackdoor = d.IsAdminBackdoor,
                IsActive = d.IsActive,
                CreatedAt = d.CreatedAt,
                ExpiresAt = d.ExpiresAt,
                MaxUsageCount = d.MaxUsageCount,
                UsageCount = d.UsageCount
            })
            .ToListAsync();
    }

    public async Task<DiscountDto?> GetByIdAsync(Guid id)
    {
        var d = await _db.DiscountCodes.FindAsync(id);
        if (d == null) return null;
        
        return new DiscountDto
        {
            Id = d.Id,
            Code = d.Code,
            PercentOff = d.PercentOff,
            AmountOff = d.AmountOff,
            IsAdminBackdoor = d.IsAdminBackdoor,
            IsActive = d.IsActive,
            CreatedAt = d.CreatedAt,
            ExpiresAt = d.ExpiresAt,
            MaxUsageCount = d.MaxUsageCount,
            UsageCount = d.UsageCount
        };
    }

    public async Task<DiscountDto> CreateAsync(CreateDiscountRequest request)
    {
        if (await _db.DiscountCodes.AnyAsync(d => d.Code == request.Code))
        {
            throw new Exception("Mã giảm giá đã tồn tại.");
        }

        var discount = new Domain.Entities.DiscountCode
        {
            Code = request.Code,
            PercentOff = request.PercentOff,
            AmountOff = request.AmountOff,
            IsAdminBackdoor = request.IsAdminBackdoor,
            ExpiresAt = request.ExpiresAt,
            MaxUsageCount = request.MaxUsageCount,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.DiscountCodes.Add(discount);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(discount.Id) ?? throw new Exception("Error creating discount.");
    }

    public async Task<DiscountDto> UpdateAsync(Guid id, UpdateDiscountRequest request)
    {
        var discount = await _db.DiscountCodes.FindAsync(id);
        if (discount == null) throw new Exception("Không tìm thấy mã giảm giá.");

        // Nếu đổi mã code, check xem trùng không
        if (discount.Code != request.Code && await _db.DiscountCodes.AnyAsync(d => d.Code == request.Code))
        {
            throw new Exception("Mã giảm giá đã tồn tại.");
        }

        discount.Code = request.Code;
        discount.PercentOff = request.PercentOff;
        discount.AmountOff = request.AmountOff;
        discount.IsAdminBackdoor = request.IsAdminBackdoor;
        discount.IsActive = request.IsActive;
        discount.ExpiresAt = request.ExpiresAt;
        discount.MaxUsageCount = request.MaxUsageCount;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(id) ?? throw new Exception("Error updating discount.");
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var discount = await _db.DiscountCodes.FindAsync(id);
        if (discount == null) return false;

        _db.DiscountCodes.Remove(discount);
        await _db.SaveChangesAsync();
        return true;
    }
}
