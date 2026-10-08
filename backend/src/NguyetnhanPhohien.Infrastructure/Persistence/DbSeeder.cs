using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

/// <summary>
/// Seed dữ liệu ban đầu: mã giảm giá mẫu + nội dung website mặc định.
/// Chạy khi app khởi động lần đầu.
/// Đăng nhập admin KHÔNG còn qua mã backdoor — dùng POST /api/auth/admin-login.
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

        // Cleanup any legacy Admin Backdoor discount codes
        await db.Database.ExecuteSqlRawAsync(@"
            DELETE FROM ""DiscountCodes"" WHERE ""IsAdminBackdoor"" = true OR ""Code"" = 'NguyetNhanPhoHienAdmin';
        ");

        // ===== SEED MÃ GIẢM GIÁ =====
        if (!await db.DiscountCodes.AnyAsync())
        {
            var codes = new List<DiscountCode>
            {
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

        // KHÔNG UPDATE sản phẩm đã tồn tại ở đây.
        // Khối UPDATE "Products" theo DisplayOrder (1,2,3) trước đây chạy MỖI lần
        // khởi động và ghi đè Tên/Mô tả mà admin đã sửa trong Dashboard.
        // Tên/mô tả mặc định nằm ở nhánh seed bên dưới — chỉ chạy khi bảng trống.

        // ===== SEED SẢN PHẨM MẶC ĐỊNH =====
        if (!await db.Products.AnyAsync())
        {
            var products = new List<Product>
            {
                new() { Name = "\"Ngọc Nhãn Tiến Vua\" (Phiên bản Ngự Thiện)", Price = 350000, Size = "500g", Description = "Khẳng định đẳng cấp. Từ \"Ngự Thiện\" (đồ ăn của vua) khiến khách hàng tò mò muốn nếm thử hương vị mà ngày xưa chỉ vua chúa mới được ăn.", DisplayOrder = 1 },
                new() { Name = "Gói \"Trân Châu Tứ Dã\"", Price = 320000, Size = "500g", Description = "\"Trân châu\" (ngọc quý) ngụ ý những viên nhãn và hạt chất lượng cao nhất được thu thập từ bốn phương (tứ dã) gói gọn trong một chiếc túi nhỏ bé.", DisplayOrder = 2 },
                new() { Name = "Lễ Hộp \"Vọng Nguyệt Thương Cảng\"", Price = 850000, Size = "1kg", Description = "Đưa người nhận xuyên không về Phố Hiến sầm uất thế kỷ 17. Mở hộp quà ra như mở ra một đêm ngắm trăng (Vọng nguyệt) bên bến thương cảng phồn hoa.", DisplayOrder = 3 }
            };
            db.Products.AddRange(products);
        }

        await db.SaveChangesAsync();
    }
}
