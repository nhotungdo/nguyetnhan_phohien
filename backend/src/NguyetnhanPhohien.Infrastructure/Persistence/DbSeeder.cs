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

        // Tự động Bật RLS (Row Level Security) cho tất cả các bảng để fix lỗi trên Supabase Security Advisor
        await db.Database.ExecuteSqlRawAsync(@"
            DO $$ 
            DECLARE 
                t record;
            BEGIN
                FOR t IN 
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                LOOP
                    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);
                END LOOP;
            END $$;
        ");

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
        // Cleanup keys cũ (snake_case) trước khi seed keys mới (CamelCase)
        await db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""WebsiteContents"" 
            WHERE ""Key"" IN ('hero_title','hero_subtitle','hero_banner_url','about_text','contact_phone','contact_address');
        ");

        if (!await db.WebsiteContents.AnyAsync())
        {
            var contents = new List<WebsiteContent>
            {
                new() { Key = "HeroTitle",      Value = "Đặc Sản Long Nhãn Phố Hiến",                                         Description = "Tiêu đề chính Hero" },
                new() { Key = "HeroSubtitle",   Value = "Hương vị truyền thống, đậm đà bản sắc Hưng Yên.",                   Description = "Mô tả phụ Hero" },
                new() { Key = "HeroBannerUrl",  Value = "",                                                                    Description = "URL ảnh banner trang chủ" },
                new() { Key = "Hotline",        Value = "090 123 4567",                                                        Description = "Số hotline liên hệ" },
                new() { Key = "Address",        Value = "Số 1, Đường Phố Hiến, Tp. Hưng Yên",                                  Description = "Địa chỉ cửa hàng" },
                new() { Key = "FooterText",     Value = "© 2026 Nguyệt Nhãn Phố Hiến. Tất cả các quyền được bảo lưu.",       Description = "Văn bản chân trang" },
            };
            db.WebsiteContents.AddRange(contents);
        }

        // ===== SEED SẢN PHẨM MẶC ĐỊNH =====
        if (!await db.Products.AnyAsync())
        {
            var products = new List<Product>
            {
                new() { Name = "Long Nhãn Đặc Biệt", Price = 350000, Size = "500g", Description = "Lựa chọn từ những quả nhãn lồng cùi dày, mọng nước nhất. Sấy khô tự nhiên bằng củi nhãn, giữ nguyên vị ngọt thanh và hương thơm đặc trưng.", DisplayOrder = 1 },
                new() { Name = "Long Nhãn Túi Zip", Price = 320000, Size = "500g", Description = "Long nhãn sấy khô đóng trong túi zip tiện dụng, dễ dàng bảo quản. Lựa chọn tuyệt vời cho gia đình thưởng thức hàng ngày.", DisplayOrder = 2 },
                new() { Name = "Set Quà Tặng Cao Cấp", Price = 850000, Size = "1kg", Description = "Hộp quà thiết kế sang trọng, bên trong là 1kg long nhãn loại 1 cao cấp nhất. Món quà sức khỏe ý nghĩa dành tặng đối tác, người thân.", DisplayOrder = 3 }
            };
            db.Products.AddRange(products);
        }

        await db.SaveChangesAsync();
    }
}
