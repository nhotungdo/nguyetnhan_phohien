using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

/// <summary>
/// Seed dữ liệu ban đầu: mã giảm giá mẫu + nội dung website mặc định.
/// Chạy khi app khởi động lần đầu.
/// Đăng nhập admin qua mã ở cấu hình Admin:LoginCode, nhập trong ô mã giảm giá trên trang chủ
/// (website không có tài khoản khách).
/// </summary>
public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.MigrateAsync();

        // Tạo các index tăng tốc truy vấn cho trang Quản trị (Dashboard / Đơn hàng / Chat)
        try
        {
            await db.Database.ExecuteSqlRawAsync(@"
                CREATE INDEX IF NOT EXISTS ""IX_Orders_CreatedAt"" ON ""Orders"" (""CreatedAt"" DESC);
                CREATE INDEX IF NOT EXISTS ""IX_Orders_Status"" ON ""Orders"" (""Status"");
                CREATE INDEX IF NOT EXISTS ""IX_Orders_CustomerPhone"" ON ""Orders"" (""CustomerPhone"");
                CREATE INDEX IF NOT EXISTS ""IX_ChatSessions_LastMessageAt"" ON ""ChatSessions"" (""LastMessageAt"" DESC);
                CREATE INDEX IF NOT EXISTS ""IX_ChatMessages_ChatSessionId_SentAt"" ON ""ChatMessages"" (""ChatSessionId"", ""SentAt"" DESC);
            ");
        }
        catch
        {
            // Bỏ qua nếu DB trong môi trường test/in-memory không hỗ trợ cú pháp Postgres
        }

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

        // ===== SEED BAO BÌ TỰ CHỌN HẠT (CUSTOM MIX PACKAGINGS) =====
        if (!await db.CustomPackagings.AnyAsync())
        {
            var packagings = new List<CustomPackaging>
            {
                new()
                {
                    Id = new Guid("c0000001-0000-0000-0000-000000000150"),
                    Name = "Túi Zip Khóa Khí Tiện Lợi",
                    PackagingType = "ZipBag",
                    CapacityGrams = 150,
                    FixedPrice = 69000,
                    ImageUrl = "/images/tuizip.jpg",
                    Description = "Túi zip tráng bạc khóa kín khí, giữ trọn hương vị và độ giòn tan, tiện lợi mang theo hàng ngày.",
                    DisplayOrder = 1
                },
                new()
                {
                    Id = new Guid("c0000001-0000-0000-0000-000000000300"),
                    Name = "Hộp Nhựa Mica Trong Suốt",
                    PackagingType = "Box",
                    CapacityGrams = 300,
                    FixedPrice = 153000,
                    ImageUrl = "/images/hopnhua.jpg",
                    Description = "Hộp tròn mica cao cấp nắp nhôm xé, bảo quản tối ưu, nhìn rõ từng tầng hạt xếp lớp sang trọng.",
                    DisplayOrder = 2
                },
                new()
                {
                    Id = new Guid("c0000001-0000-0000-0000-000000000900"),
                    Name = "Lễ Hộp Quà Tặng Hoàng Gia",
                    PackagingType = "GiftSet",
                    CapacityGrams = 900,
                    FixedPrice = 756000,
                    ImageUrl = "/images/setqua.jpg",
                    Description = "Lễ hộp cao cấp mang âm hưởng Phố Hiến ngàn năm kèm túi xách trang trọng, món quà thượng hạng trao gửi yêu thương.",
                    DisplayOrder = 3
                }
            };
            db.CustomPackagings.AddRange(packagings);
        }

        // ===== SEED 5 LOẠI HẠT NGUYÊN LIỆU (KHÔNG ÓC CHÓ, KHÔNG TÁO ĐỎ, KHÔNG KỶ TỬ, KHÔNG HẠT SEN) =====
        if (!await db.CustomIngredients.AnyAsync())
        {
            var ingredients = new List<CustomIngredient>
            {
                new()
                {
                    Id = new Guid("d0000001-0000-0000-0000-000000000001"),
                    Name = "Long Nhãn Phố Hiến Tuyển Chọn",
                    CaloriesPer100g = 310,
                    ImageUrl = "/images/nuts/longnhanomsen.jpg",
                    Description = "Cùi dày dẻo thơm, màu vàng cánh gián hổ phách, sấy đối lưu nhiệt nóng bí truyền, vị ngọt thanh tao tự nhiên.",
                    Tagline = "Đặc sản Phố Hiến tiến vua, bổ khí huyết, an thần ngủ ngon",
                    MinGrams = 0,
                    MaxGrams = 900,
                    StepGrams = 10,
                    DisplayOrder = 1
                },
                new()
                {
                    Id = new Guid("d0000001-0000-0000-0000-000000000003"),
                    Name = "Hạt Macca Tây Nguyên (Tách Nhân)",
                    CaloriesPer100g = 718,
                    ImageUrl = "/images/nuts/macca.jpg",
                    Description = "Nữ hoàng các loại hạt, nhân trắng ngà béo ngậy thơm ngon, tan nhẹ trên đầu lưỡi.",
                    Tagline = "Giàu Omega-7 và chất béo không bão hòa đơn tốt cho tim mạch",
                    MinGrams = 0,
                    MaxGrams = 900,
                    StepGrams = 10,
                    DisplayOrder = 2
                },
                new()
                {
                    Id = new Guid("d0000001-0000-0000-0000-000000000004"),
                    Name = "Hạt Điều Bình Phước Rang Mộc (A+)",
                    CaloriesPer100g = 553,
                    ImageUrl = "/images/nuts/hatdieu.jpg",
                    Description = "Hạt điều to mập mẩy, rang mộc giữ trọn độ giòn rụm và vị ngọt bùi thuần khiết.",
                    Tagline = "Bổ sung năng lượng tức thì, giàu protein và magie tự nhiên",
                    MinGrams = 0,
                    MaxGrams = 900,
                    StepGrams = 10,
                    DisplayOrder = 3
                },
                new()
                {
                    Id = new Guid("d0000001-0000-0000-0000-000000000005"),
                    Name = "Hạnh Nhân Nướng Mộc California",
                    CaloriesPer100g = 579,
                    ImageUrl = "/images/nuts/hanhnhan.jpg",
                    Description = "Hạnh nhân nguyên hạt nướng mộc tự nhiên, giòn chắc thơm bùi đậm vị.",
                    Tagline = "Dồi dào Vitamin E và chất xơ, hỗ trợ vóc dáng & làn da mịn màng",
                    MinGrams = 0,
                    MaxGrams = 900,
                    StepGrams = 10,
                    DisplayOrder = 4
                },
                new()
                {
                    Id = new Guid("d0000001-0000-0000-0000-000000000006"),
                    Name = "Hạt Bí Xanh Ấn Độ",
                    CaloriesPer100g = 559,
                    ImageUrl = "/images/nuts/bixanh.jpg",
                    Description = "Hạt mẩy xanh ngọc đều đặn, vị bùi béo thanh nhẹ, sấy mộc giòn thơm.",
                    Tagline = "Giàu kẽm, magie và chất chống oxy hóa tăng cường đề kháng",
                    MinGrams = 0,
                    MaxGrams = 900,
                    StepGrams = 10,
                    DisplayOrder = 5
                }
            };
            db.CustomIngredients.AddRange(ingredients);
        }
        else
        {
            // Tắt kích hoạt Hạt Sen nếu đã seed trước đó để đồng bộ 5 loại hạt
            var sen = await db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == new Guid("d0000001-0000-0000-0000-000000000002"));
            if (sen != null && sen.IsActive)
            {
                sen.IsActive = false;
            }

            // Đồng bộ ảnh Long Nhãn ôm sen mới nhất
            var longNhan = await db.CustomIngredients.FirstOrDefaultAsync(i => i.Id == new Guid("d0000001-0000-0000-0000-000000000001"));
            if (longNhan != null && longNhan.ImageUrl != "/images/nuts/longnhanomsen.jpg")
            {
                longNhan.ImageUrl = "/images/nuts/longnhanomsen.jpg";
            }
        }

        await db.SaveChangesAsync();
    }
}
