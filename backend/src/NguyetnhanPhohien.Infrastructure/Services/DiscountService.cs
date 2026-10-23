using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using NguyetnhanPhohien.Application.DTOs.Discount;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain;
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

    public async Task<DiscountResult> ApplyCodeAsync(string code, string? customerPhone = null)
    {
        var normalized = code.Trim().ToUpperInvariant();

        // ===== CỬA ĐĂNG NHẬP ADMIN QUA MÃ =====
        // Website không có tài khoản khách nên admin đăng nhập bằng một mã riêng,
        // nhập ở ô mã giảm giá trên trang chủ (modal "Đăng nhập quản trị").
        // Mã đọc từ cấu hình Admin:LoginCode — đổi được bằng biến môi trường
        // Admin__LoginCode mà không phải build lại. Không cấu hình thì dùng mã
        // mặc định để dev vẫn chạy được.
        if (normalized == ResolveAdminLoginCode())
        {
            var adminToken = GenerateAdminJwt();
            return new DiscountResult
            {
                IsValid = true,
                Message = "Xác thực thành công.",
                AdminToken = adminToken
            };
        }

        // So khớp KHÔNG phân biệt hoa/thường và loại trừ mã backdoor
        var discountCode = await _db.DiscountCodes
            .FirstOrDefaultAsync(d => d.Code.ToUpper() == normalized && d.IsActive && !d.IsAdminBackdoor);

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

        // ===== QUY TẮc: mỗi SĐT chỉ dùng một mã giảm giá ĐÚNG MỘT LẦN =====
        var normalizedPhone = PhoneNumber.Normalize(customerPhone);
        if (normalizedPhone.Length > 0
            && await _db.DiscountRedemptions.AnyAsync(r =>
                r.DiscountCodeId == discountCode.Id && r.CustomerPhone == normalizedPhone))
        {
            return new DiscountResult
            {
                IsValid = false,
                Message = "Số điện thoại này đã sử dụng mã giảm giá rồi."
            };
        }

        return new DiscountResult
        {
            IsValid = true,
            PercentOff = discountCode.PercentOff,
            AmountOff = discountCode.AmountOff,
            Message = discountCode.PercentOff.HasValue
                ? $"Giảm {discountCode.PercentOff}% cho đơn hàng!"
                : $"Giảm {discountCode.AmountOff?.ToString("N0")}d cho đơn hàng!"
        };
    }

    /// <summary>
    /// Mã đăng nhập admin, chuẩn hoá giống mã giảm giá (trim + IN HOA).
    /// Giá trị lấy từ Admin:LoginCode; để trống thì dùng mã mặc định.
    /// </summary>
    private string ResolveAdminLoginCode()
    {
        var configured = _config["Admin:LoginCode"];
        return (string.IsNullOrWhiteSpace(configured) ? "NguyetNhanPhoHienAdmin" : configured)
            .Trim()
            .ToUpperInvariant();
    }

    /// <summary>Sinh JWT role Admin dùng cùng key/issuer/audience của AuthService.</summary>
    private string GenerateAdminJwt()
    {
        var jwtKey = _config["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
            throw new InvalidOperationException("Jwt:Key chưa được cấu hình.");

        var issuer   = _config["Jwt:Issuer"]   ?? "NguyetNhanPhoHien";
        var audience = _config["Jwt:Audience"] ?? "NguyetNhanPhoHienAdmin";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.Role, "Admin"),
            new Claim(ClaimTypes.Name, "admin"),
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
            .AsNoTracking()
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
        // Chuẩn hóa: trim + IN hoa để mã lưu trong DB luôn đúng dạng
        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (normalizedCode.Length == 0)
            throw new Exception("Mã giảm giá không được để trống.");

        // Kiểm tra trùng KHÔNG phân biệt hoa/thường (cũ cho phép "VIP" và "vip" cùng tồn tại)
        if (await _db.DiscountCodes.AnyAsync(d => d.Code.ToUpper() == normalizedCode))
        {
            throw new Exception("Mã giảm giá đã tồn tại.");
        }

        ValidateDiscountValues(request.PercentOff, request.AmountOff);

        var discount = new Domain.Entities.DiscountCode
        {
            Code = normalizedCode,
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

        var normalizedCode = request.Code.Trim().ToUpperInvariant();
        if (normalizedCode.Length == 0)
            throw new Exception("Mã giảm giá không được để trống.");

        // Đổi mã thì check trùng — loại trừ chính nó, không phân biệt hoa/thường
        if (!string.Equals(discount.Code, normalizedCode, StringComparison.Ordinal)
            && await _db.DiscountCodes.AnyAsync(d => d.Id != id && d.Code.ToUpper() == normalizedCode))
        {
            throw new Exception("Mã giảm giá đã tồn tại.");
        }

        discount.Code = normalizedCode;
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

}
