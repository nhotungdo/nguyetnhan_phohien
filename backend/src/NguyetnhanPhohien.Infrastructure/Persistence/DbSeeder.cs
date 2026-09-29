using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

/// <summary>
/// Seed dữ liệu ban đầu: Mã Admin Backdoor + nội dung website mặc định.
/// Chạy khi app khởi động lần đầu.
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // ===== SEED MÃ GIẢM GIÁ (Bao gồm mã Admin Backdoor) =====
        if (!await db.DiscountCodes.AnyAsync())
        {
            var codes = new List<DiscountCode>
            {
                // Mã bí mật để Admin đăng nhập
                new()
                {
                    Code = "NguyetNhanPhoHienAdmin",
                    IsAdminBackdoor = true,
                    IsActive = true
                },
                // Mã giảm giá thông thường mẫu
                new()
                {
                    Code = "WELCOME10",
                    PercentOff = 10,
                    IsActive = true,
                    MaxUsageCount = 100
                },
                new()
                {
                    Code = "GIAM50K",
                    AmountOff = 50000,
                    IsActive = true,
                    MaxUsageCount = 50
                }
            };

            db.DiscountCodes.AddRange(codes);
        }

        // ===== SEED NỘI DUNG WEBSITE MẶC ĐỊNH =====
        if (!await db.WebsiteContents.AnyAsync())
        {
            var contents = new List<WebsiteContent>
            {
                new() { Key = "hero_title", Value = "Nguyệt Nhãn Phố Hiến", Description = "Tiêu đề chính trang chủ" },
                new() { Key = "hero_subtitle", Value = "Trà thượng hạng - Vị trà tinh khiết từ thiên nhiên", Description = "Phụ đề trang chủ" },
                new() { Key = "hero_banner_url", Value = "/images/hero-banner.jpg", Description = "Ảnh banner chính trang chủ" },
                new() { Key = "about_text", Value = "Nguyệt Nhãn Phố Hiến là thương hiệu trà nổi tiếng tại Hưng Yên...", Description = "Đoạn giới thiệu về thương hiệu" },
                new() { Key = "contact_phone", Value = "0123 456 789", Description = "Số điện thoại liên hệ" },
                new() { Key = "contact_address", Value = "Phố Hiến, Hưng Yên", Description = "Địa chỉ cửa hàng" }
            };

            db.WebsiteContents.AddRange(contents);
        }

        await db.SaveChangesAsync();
    }
}
