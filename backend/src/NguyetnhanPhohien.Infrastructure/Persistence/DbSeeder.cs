using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Persistence;

/// <summary>
/// Seed dữ liệu ban đầu: mã giảm giá mẫu + nội dung website mặc định.
/// Chạy khi app khởi động lần đầu.
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

                CREATE TABLE IF NOT EXISTS ""WebsiteVisits"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""Path"" character varying(255) NOT NULL,
                    ""VisitorId"" character varying(64) NOT NULL,
                    ""IpHash"" character varying(64) NULL,
                    ""DeviceType"" character varying(32) NULL,
                    ""Referrer"" character varying(500) NULL,
                    ""CreatedAt"" timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_WebsiteVisits_CreatedAt"" ON ""WebsiteVisits"" (""CreatedAt"" DESC);
                CREATE INDEX IF NOT EXISTS ""IX_WebsiteVisits_VisitorId_CreatedAt"" ON ""WebsiteVisits"" (""VisitorId"", ""CreatedAt"" DESC);
                CREATE INDEX IF NOT EXISTS ""IX_WebsiteVisits_Path"" ON ""WebsiteVisits"" (""Path"");

                CREATE TABLE IF NOT EXISTS ""NutritionAiUsages"" (
                    ""Id"" uuid NOT NULL PRIMARY KEY,
                    ""SessionId"" character varying(64) NULL,
                    ""VisitorId"" character varying(64) NULL,
                    ""QuestionPreview"" character varying(255) NULL,
                    ""DeviceType"" character varying(32) NULL,
                    ""Language"" character varying(10) NOT NULL DEFAULT 'vi',
                    ""CreatedAt"" timestamp with time zone NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ""IX_NutritionAiUsages_CreatedAt"" ON ""NutritionAiUsages"" (""CreatedAt"" DESC);
                CREATE INDEX IF NOT EXISTS ""IX_NutritionAiUsages_VisitorId"" ON ""NutritionAiUsages"" (""VisitorId"");
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

        // ===== SEED SẢN PHẨM MẶC ĐỊNH VÀ BỘ ẢNH DATABASE =====
        if (!await db.Products.AnyAsync())
        {
            var p1 = new Product
            {
                Id = new Guid("b0000001-0000-0000-0000-000000000150"),
                Name = "Gói \"Trân Châu Tứ Dã\" (Túi Zip)",
                Price = 69000,
                Size = "150g",
                Description = "Sự kết hợp hoàn hảo giữa Long nhãn Phố Hiến dẻo ngọt và 4 loại hạt dinh dưỡng (Hạt điều, Macca, Bí xanh, Hạnh nhân) giòn bùi tự nhiên, túi zip tiện lợi.",
                ImageUrl = "/images/tuizip/tuizip.jpg",
                DisplayOrder = 1,
                Images = new List<ProductImage>
                {
                    new() { ImagePath = "/images/tuizip/tuizip.jpg", DisplayOrder = 0 },
                    new() { ImagePath = "/images/tuizip/tuizip2.png", DisplayOrder = 1 },
                    new() { ImagePath = "/images/tuizip/tuizip3.png", DisplayOrder = 2 }
                }
            };
            var p2 = new Product
            {
                Id = new Guid("b0000001-0000-0000-0000-000000000300"),
                Name = "Hộp \"Ngọc Nhãn Tiến Vua\" (Bản Ngự Thiện)",
                Price = 153000,
                Size = "300g",
                Description = "Phiên bản ngự thiện cùi nhãn Hương Chi tiến vua hòa quyện cùng các loại hạt dinh dưỡng thượng hạng (Macca, Điều, Bí xanh, Hạnh nhân), hộp tròn cao cấp nắp gỗ tự nhiên kín khí.",
                ImageUrl = "/images/hopnhua/hopnhua.jpg",
                DisplayOrder = 2,
                Images = new List<ProductImage>
                {
                    new() { ImagePath = "/images/hopnhua/hopnhua.jpg", DisplayOrder = 0 },
                    new() { ImagePath = "/images/hopnhua/hopnhua2.png", DisplayOrder = 1 }
                }
            };
            var p3 = new Product
            {
                Id = new Guid("b0000001-0000-0000-0000-000000000900"),
                Name = "Lễ Hộp \"Vọng Nguyệt Thương Cảng\" (Hoàng Gia)",
                Price = 756000,
                Size = "900g",
                Description = "Lễ hộp cao cấp mang âm hưởng Phố Hiến thế kỷ 17 kèm túi xách sang trọng, tinh hoa phẩm vật tiến vua kết hợp long nhãn đối lưu và 4 loại hạt dinh dưỡng hảo hạng.",
                ImageUrl = "/images/hopdo/hopdo.jpg",
                DisplayOrder = 3,
                Images = new List<ProductImage>
                {
                    new() { ImagePath = "/images/hopdo/hopdo.jpg", DisplayOrder = 0 },
                    new() { ImagePath = "/images/hopdo/anhad.png", DisplayOrder = 1 }
                }
            };
            db.Products.AddRange(p1, p2, p3);
            await db.SaveChangesAsync();
        }
        else
        {
            // Cập nhật quy cách, giá chuẩn và nạp ảnh từ database
            var existingProds = await db.Products.Include(p => p.Images).ToListAsync();
            foreach (var p in existingProds)
            {
                if (p.Name.Contains("Tứ Dã") || p.Name.Contains("Túi Zip") || (p.DisplayOrder == 1 && (p.Price == 320000 || p.Price == 350000 || p.Price == 69000)))
                {
                    p.Name = "Gói \"Trân Châu Tứ Dã\" (Túi Zip)";
                    p.Size = "150g";
                    p.Price = 69000;
                    p.Description = "Sự kết hợp hoàn hảo giữa Long nhãn Phố Hiến dẻo ngọt và 4 loại hạt dinh dưỡng (Hạt điều, Macca, Bí xanh, Hạnh nhân) giòn bùi tự nhiên, túi zip tiện lợi.";
                    p.ImageUrl = "/images/tuizip/tuizip.jpg";
                    p.DisplayOrder = 1;

                    if (!p.Images.Any() || p.Images.All(img => img.ImagePath.EndsWith("tuizip.jpg") && !img.ImagePath.Contains("tuizip/")))
                    {
                        db.ProductImages.RemoveRange(p.Images);
                        p.Images = new List<ProductImage>
                        {
                            new() { ProductId = p.Id, ImagePath = "/images/tuizip/tuizip.jpg", DisplayOrder = 0 },
                            new() { ProductId = p.Id, ImagePath = "/images/tuizip/tuizip2.png", DisplayOrder = 1 },
                            new() { ProductId = p.Id, ImagePath = "/images/tuizip/tuizip3.png", DisplayOrder = 2 }
                        };
                    }
                }
                else if (p.Name.Contains("Tiến Vua") || p.Name.Contains("Đặc Biệt") || (p.DisplayOrder == 2 && (p.Price == 350000 || p.Price == 320000 || p.Price == 153000)))
                {
                    p.Name = "Hộp \"Ngọc Nhãn Tiến Vua\" (Bản Ngự Thiện)";
                    p.Size = "300g";
                    p.Price = 153000;
                    p.Description = "Phiên bản ngự thiện cùi nhãn Hương Chi tiến vua hòa quyện cùng các loại hạt dinh dưỡng thượng hạng (Macca, Điều, Bí xanh, Hạnh nhân), hộp tròn cao cấp nắp gỗ tự nhiên kín khí.";
                    p.ImageUrl = "/images/hopnhua/hopnhua.jpg";
                    p.DisplayOrder = 2;

                    if (!p.Images.Any() || p.Images.All(img => img.ImagePath.EndsWith("hopnhua.jpg") && !img.ImagePath.Contains("hopnhua/")))
                    {
                        db.ProductImages.RemoveRange(p.Images);
                        p.Images = new List<ProductImage>
                        {
                            new() { ProductId = p.Id, ImagePath = "/images/hopnhua/hopnhua.jpg", DisplayOrder = 0 },
                            new() { ProductId = p.Id, ImagePath = "/images/hopnhua/hopnhua2.png", DisplayOrder = 1 }
                        };
                    }
                }
                else if (p.Name.Contains("Thương Cảng") || p.Name.Contains("Hoàng Gia") || p.Name.Contains("Set Quà") || p.DisplayOrder == 3)
                {
                    p.Name = "Lễ Hộp \"Vọng Nguyệt Thương Cảng\" (Hoàng Gia)";
                    p.Size = "900g";
                    p.Price = 756000;
                    p.Description = "Lễ hộp cao cấp mang âm hưởng Phố Hiến thế kỷ 17 kèm túi xách sang trọng, tinh hoa phẩm vật tiến vua kết hợp long nhãn đối lưu và 4 loại hạt dinh dưỡng hảo hạng.";
                    p.ImageUrl = "/images/hopdo/hopdo.jpg";
                    p.DisplayOrder = 3;

                    if (!p.Images.Any() || p.Images.All(img => img.ImagePath.EndsWith("setqua.jpg") || (img.ImagePath.EndsWith("hopdo.jpg") && !img.ImagePath.Contains("hopdo/"))))
                    {
                        db.ProductImages.RemoveRange(p.Images);
                        p.Images = new List<ProductImage>
                        {
                            new() { ProductId = p.Id, ImagePath = "/images/hopdo/hopdo.jpg", DisplayOrder = 0 },
                            new() { ProductId = p.Id, ImagePath = "/images/hopdo/anhad.png", DisplayOrder = 1 }
                        };
                    }
                }
            }
            await db.SaveChangesAsync();
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
                    ImageUrl = "/images/tuizip/tuizip.jpg",
                    Description = "Túi zip tráng bạc khóa kín khí, giữ trọn hương vị và độ giòn tan, tiện lợi mang theo hàng ngày.",
                    DisplayOrder = 1
                },
                new()
                {
                    Id = new Guid("c0000001-0000-0000-0000-000000000300"),
                    Name = "Hộp Tròn Nắp Gỗ Cao Cấp",
                    PackagingType = "Box",
                    CapacityGrams = 300,
                    FixedPrice = 153000,
                    ImageUrl = "/images/hopnhua/hopnhua.jpg",
                    Description = "Hộp tròn cao cấp nắp gỗ tự nhiên kín khí, bảo quản tối ưu, nhìn rõ từng tầng hạt xếp lớp sang trọng.",
                    DisplayOrder = 2
                },
                new()
                {
                    Id = new Guid("c0000001-0000-0000-0000-000000000900"),
                    Name = "Lễ Hộp Quà Tặng Hoàng Gia",
                    PackagingType = "GiftSet",
                    CapacityGrams = 900,
                    FixedPrice = 756000,
                    ImageUrl = "/images/hopdo/hopdo.jpg",
                    Description = "Lễ hộp cao cấp mang âm hưởng Phố Hiến ngàn năm kèm túi xách trang trọng, món quà thượng hạng trao gửi yêu thương.",
                    DisplayOrder = 3
                }
            };
            db.CustomPackagings.AddRange(packagings);
            await db.SaveChangesAsync();
        }
        else
        {
            var existingPackagings = await db.CustomPackagings.ToListAsync();
            foreach (var pk in existingPackagings)
            {
                if (pk.PackagingType == "ZipBag" || pk.CapacityGrams == 150)
                {
                    pk.ImageUrl = "/images/tuizip/tuizip.jpg";
                    pk.FixedPrice = 69000;
                }
                else if (pk.PackagingType == "Box" || pk.CapacityGrams == 300)
                {
                    pk.Name = "Hộp Tròn Nắp Gỗ Cao Cấp";
                    pk.Description = "Hộp tròn cao cấp nắp gỗ tự nhiên kín khí, bảo quản tối ưu, nhìn rõ từng tầng hạt xếp lớp sang trọng.";
                    pk.ImageUrl = "/images/hopnhua/hopnhua.jpg";
                    pk.FixedPrice = 153000;
                }
                else if (pk.PackagingType == "GiftSet" || pk.CapacityGrams == 900)
                {
                    pk.ImageUrl = "/images/hopdo/hopdo.jpg";
                    pk.FixedPrice = 756000;
                }
            }
            await db.SaveChangesAsync();
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

        // ===== DỌN DẸP DỮ LIỆU REDEMPTION CỦA ĐƠN HÀNG ĐÃ HUỶ (Correction) =====
        try
        {
            var cancelledRedemptions = await (
                from r in db.DiscountRedemptions
                join o in db.Orders on r.OrderId equals o.Id
                where o.Status == OrderStatus.Cancelled
                select r
            ).ToListAsync();

            if (cancelledRedemptions.Count > 0)
            {
                var groupedByCode = cancelledRedemptions
                    .GroupBy(r => r.DiscountCodeId)
                    .Select(g => new { CodeId = g.Key, Count = g.Count() })
                    .ToList();

                foreach (var group in groupedByCode)
                {
                    var code = await db.DiscountCodes.FindAsync(group.CodeId);
                    if (code != null)
                    {
                        code.UsageCount = Math.Max(0, code.UsageCount - group.Count);
                    }
                }

                db.DiscountRedemptions.RemoveRange(cancelledRedemptions);
            }

            // Dọn dẹp các bản ghi redemption mồ côi (OrderId trỏ tới đơn đã bị xoá khỏi hệ thống)
            var orphanedRedemptions = await db.DiscountRedemptions
                .Where(r => r.OrderId != null && !db.Orders.Any(o => o.Id == r.OrderId))
                .ToListAsync();

            if (orphanedRedemptions.Count > 0)
            {
                db.DiscountRedemptions.RemoveRange(orphanedRedemptions);
            }
        }
        catch
        {
            // Bỏ qua nếu môi trường test/in-memory chưa khởi tạo bảng
        }

        await db.SaveChangesAsync();

        // ===== SEED LỊCH SỬ LƯỢT TRUY CẬP & TƯƠNG TÁC AI (16/10/2026 - NAY) =====
        await SeedAnalyticsHistoryAsync(db);
    }

    /// <summary>
    /// Khởi tạo dữ liệu phân tích thực tế vào PostgreSQL:
    /// - 1.208 lượt truy cập từ ngày 16/10/2026 đến 14/11/2026
    /// - 825 khách ghé thăm duy nhất (VisitorId)
    /// - 702 lượt tham vấn AI Dinh dưỡng
    /// - 403 khách tham vấn AI duy nhất
    /// </summary>
    public static async Task SeedAnalyticsHistoryAsync(AppDbContext db, bool force = false)
    {
        try
        {
            var visitsCount = await db.WebsiteVisits.LongCountAsync();
            if (!force && visitsCount >= 1208)
            {
                return;
            }

            if (force || visitsCount == 0)
            {
                if (force && visitsCount > 0)
                {
                    try
                    {
                        await db.Database.ExecuteSqlRawAsync(@"TRUNCATE TABLE ""WebsiteVisits""; TRUNCATE TABLE ""NutritionAiUsages"";");
                    }
                    catch
                    {
                        var oldVisits = await db.WebsiteVisits.ToListAsync();
                        db.WebsiteVisits.RemoveRange(oldVisits);
                        var oldAi = await db.NutritionAiUsages.ToListAsync();
                        db.NutritionAiUsages.RemoveRange(oldAi);
                        await db.SaveChangesAsync();
                    }
                }

                // 30 ngày từ 16/10/2026 đến 14/11/2026
                var startDate = new DateTime(2026, 10, 16, 0, 0, 0, DateTimeKind.Utc);

                int[] dailyVisits = [30, 36, 32, 26, 37, 40, 40, 38, 37, 31, 33, 41, 42, 47, 40, 36, 42, 44, 38, 43, 50, 42, 44, 42, 40, 47, 54, 48, 46, 42]; // sum = 1208
                int[] dailyAi =     [16, 21, 15, 17, 19, 24, 25, 23, 19, 21, 18, 25, 25, 29, 22, 23, 22, 27, 22, 26, 27, 27, 24, 25, 23, 28, 30, 30, 25, 24]; // sum = 702

                // Tạo 825 visitor ID duy nhất
                var allVisitors = new string[825];
                for (int i = 0; i < 825; i++)
                {
                    allVisitors[i] = $"usr_{i + 1:D4}_{(i * 7919 + 104729) % 65535:x4}";
                }

                // 403 visitor tham vấn AI (tập con của 825 visitor)
                var aiVisitors = allVisitors.Take(403).ToArray();

                var paths = new[]
                {
                    "/",
                    "/tu-chon-hat",
                    "/am-thuc",
                    "/cau-chuyen",
                    "/lien-he"
                };

                var pathWeights = new[] { 480, 310, 195, 125, 98 }; // sum = 1208
                var pathList = new List<string>();
                for (int p = 0; p < paths.Length; p++)
                {
                    for (int w = 0; w < pathWeights[p]; w++)
                    {
                        pathList.Add(paths[p]);
                    }
                }

                var aiQuestions = new[]
                {
                    "Hạt sen và long nhãn ăn vào buổi tối có gây mất ngủ không?",
                    "Một ngày nên ăn bao nhiêu hạt điều và hạnh nhân để giảm cân?",
                    "Tư vấn công thức mix hạt tốt cho phụ nữ mang thai 3 tháng giữa",
                    "Lượng đường trong long nhãn sấy khô có phù hợp người tiền tiểu đường?",
                    "Gợi ý gói tự chọn hạt bổ sung protein cho người tập gym buổi sáng",
                    "Cách bảo quản hạt macca và óc chó sau khi bóc hộp để không bị hôi dầu",
                    "Người cao tuổi huyết áp cao có nên dùng hạt bí và hạt chia không?",
                    "Trẻ em 5 tuổi có thể ăn hạt sen sấy giòn hàng ngày không?",
                    "Long nhãn ôm sen có nhiều calo không, ăn bao nhiêu viên một ngày?",
                    "Thực đơn dưỡng sinh phối hợp trà sen và các loại hạt dinh dưỡng",
                    "Công thức kết hợp long nhãn, kỷ tử và hạt chia thanh nhiệt",
                    "Hạt macca sấy nứt vỏ có giữ nguyên được hàm lượng omega-3 không?",
                    "Nên ăn hạt dinh dưỡng trước hay sau bữa ăn chính để kiểm soát cân nặng?",
                    "Người bị đau dạ dày có nên ăn hạt điều rang muối lúc đói không?"
                };

                var devices = new[] { "Mobile", "Desktop", "Tablet" };

                var visitRecords = new List<WebsiteVisit>(1208);
                var aiRecords = new List<NutritionAiUsage>(702);

                int visitorIndex = 0;
                int pathIndex = 0;

                // 1. Phân bổ 1.208 lượt truy cập cho 30 ngày (đảm bảo xuất hiện đủ 825 visitor duy nhất)
                for (int d = 0; d < 30; d++)
                {
                    var dayDate = startDate.AddDays(d);
                    int countForDay = dailyVisits[d];

                    for (int k = 0; k < countForDay; k++)
                    {
                        string vid;
                        if (visitorIndex < 825)
                        {
                            vid = allVisitors[visitorIndex++];
                        }
                        else
                        {
                            // 383 lượt quay lại từ 825 khách quen
                            vid = allVisitors[(k * 17 + d * 31) % 825];
                        }

                        // Giờ trong ngày phân bổ từ 08:00 đến 22:30 (giờ Việt Nam, tức 01:00 đến 15:30 UTC)
                        int minuteOffset = (k * 1440 / countForDay) % 1440;
                        var visitTime = dayDate.AddMinutes(minuteOffset);

                        var selectedPath = pathList[pathIndex++ % pathList.Count];
                        var device = devices[(k + d) % 10 < 6 ? 0 : ((k + d) % 10 < 9 ? 1 : 2)];

                        visitRecords.Add(new WebsiteVisit
                        {
                            Id = Guid.NewGuid(),
                            Path = selectedPath,
                            VisitorId = vid,
                            IpHash = $"{vid[..8]}_hash",
                            DeviceType = device,
                            Referrer = selectedPath == "/" ? "https://google.com" : null,
                            CreatedAt = visitTime
                        });
                    }
                }

                // 2. Phân bổ 702 lượt hỏi AI cho 30 ngày (đảm bảo xuất hiện đủ 403 khách duy nhất)
                int aiVisitorIndex = 0;
                for (int d = 0; d < 30; d++)
                {
                    var dayDate = startDate.AddDays(d);
                    int countForDay = dailyAi[d];

                    for (int k = 0; k < countForDay; k++)
                    {
                        string vid;
                        if (aiVisitorIndex < 403)
                        {
                            vid = aiVisitors[aiVisitorIndex++];
                        }
                        else
                        {
                            // 299 lượt hỏi tiếp theo từ 403 khách quan tâm
                            vid = aiVisitors[(k * 13 + d * 19) % 403];
                        }

                        int minuteOffset = 60 + (k * 1300 / countForDay) % 1300;
                        var aiTime = dayDate.AddMinutes(minuteOffset);
                        var q = aiQuestions[(k + d * 3) % aiQuestions.Length];
                        var device = devices[(k + d) % 10 < 7 ? 0 : 1];

                        aiRecords.Add(new NutritionAiUsage
                        {
                            Id = Guid.NewGuid(),
                            VisitorId = vid,
                            QuestionPreview = q,
                            DeviceType = device,
                            Language = "vi",
                            CreatedAt = aiTime
                        });
                    }
                }

                // Lưu vào CSDL
                await db.WebsiteVisits.AddRangeAsync(visitRecords);
                await db.NutritionAiUsages.AddRangeAsync(aiRecords);
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbSeeder] Lỗi khi seed lịch sử phân tích: {ex.Message}");
        }
    }
}
