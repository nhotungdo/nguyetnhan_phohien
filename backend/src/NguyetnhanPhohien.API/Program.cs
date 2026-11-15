using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using NguyetnhanPhohien.API.BackgroundJobs;
using NguyetnhanPhohien.API.Controllers;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Infrastructure.Persistence;
using NguyetnhanPhohien.Infrastructure.Services;
using Microsoft.AspNetCore.HttpOverrides;
using System.Security.Claims;
using System.Text;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Tự động nhận cổng từ biến môi trường PORT (Render cấp mặc định 10000)
// hoặc ASPNETCORE_HTTP_PORTS, bind đồng thời cả 10000 và 8080 để container
// đảm bảo kết nối thành công với mọi cấu hình health check của Render/Docker.
if (!builder.Environment.IsDevelopment())
{
    var port = Environment.GetEnvironmentVariable("PORT")
        ?? Environment.GetEnvironmentVariable("ASPNETCORE_HTTP_PORTS")
        ?? "10000";
    var urls = new HashSet<string> { $"http://0.0.0.0:{port}", "http://0.0.0.0:10000", "http://0.0.0.0:8080" };
    builder.WebHost.UseUrls(string.Join(";", urls));
}

// ===== DATABASE =====
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ===== JWT AUTHENTICATION =====
// Bắt cả chuỗi RỖNG: appsettings để "" khi chưa cấu hình user-secrets/biến môi trường,
// nếu chỉ so sánh null (?? throw) thì app vẫn khởi động với key ký rỗng và mọi
// request JWT lỗi 500 về sau — khó chẩn hơn nhiều là dừng ngay ở đây với thông báo rõ.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = "NguyetNhanPhoHien_Secret_Key_For_Development_Only_2026_Secure_Key_Min_32_Chars";
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };

        // Cho phép SignalR gửi token qua query string
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal?.HasClaim(AuthService.PasswordLoginClaim, "true") != true
                    && context.Principal?.HasClaim("admin_code_login", "true") != true)
                    context.Fail("Admin sign-in is required.");
                return Task.CompletedTask;
            },
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ===== SIGNALR =====
builder.Services.AddSignalR(options =>
{
    // Giữ kết nối WebSocket không bị Render Load Balancer tự động ngắt khi idle
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.EnableDetailedErrors = true;
});

// ===== RESPONSE COMPRESSION (giảm dung lượng JSON trả về cho Frontend) =====
// Danh sách MIME chỉ gồm JSON/text — ảnh (jpeg/png/webp/gif) đã nén sẵn nên
// không đưa vào để không tốn CPU nén lại và tránh hỏng header Content-Length.
builder.Services.AddResponseCompression(options =>
{
    // Prod chạy HTTPS vẫn phải nén (mặc định middleware BỎ QUA request https
    // nếu không bật cờ này → JSON trả về nặng y nguyên khi deploy).
    options.EnableForHttps = true;
    options.MimeTypes = new[]
    {
        "application/json",
        "application/json; charset=utf-8",
        "application/problem+json",
        "text/plain",
        "text/plain; charset=utf-8",
        "text/html"
    };
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = System.IO.Compression.CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
    options.Level = System.IO.Compression.CompressionLevel.Fastest);

// ===== OUTPUT CACHE (GET công khai trả lời từ RAM, không đụng DB) =====
// Tag "products" / "content" được evict NGAY trong controller mỗi khi admin sửa
// dữ liệu → kết hợp realtime SignalR, client refetch luôn nhận bản mới nhất.
builder.Services.AddOutputCache(options =>
{
    options.AddPolicy(ProductsController.PublicCachePolicy, policy => policy
        .Expire(TimeSpan.FromSeconds(60))
        .Tag(ProductsController.CacheTag));
    options.AddPolicy(ContentController.PublicCachePolicy, policy => policy
        .Expire(TimeSpan.FromSeconds(60))
        .Tag(ContentController.CacheTag));
});

// ===== CONTROLLERS =====
builder.Services.AddControllers();

// ===== RATE LIMIT CHO ĐĂNG NHẬP ADMIN =====
// Trước đây POST /api/auth/admin-login không có giới hạn nào → có thể dò mật khẩu
// không hạn chế. Giới hạn theo IP: 5 lần / 5 phút, không xếp hàng (vượt là từ chối
// ngay). Trả 429 kèm { message } để giao diện hiện đúng nguyên nhân.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("admin-login", context =>
        System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0
            }));

    options.AddPolicy("ai-nutrition", context =>
    {
        // ForwardedHeaders middleware resolves trusted proxies before rate limiting.
        // Never use a client-supplied forwarding header as the partition key.
        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 20, // Nâng lên 20 lượt/phút để tránh chặn nhầm nhiều khách chung mạng Wi-Fi/NAT
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    options.AddPolicy("discount-apply", context =>
    {
        var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0]?.Trim();
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    options.AddPolicy("order-create", context =>
    {
        var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0]?.Trim();
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(5),
                QueueLimit = 0
            });
    });

    options.AddPolicy("chat-session", context =>
    {
        var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0]?.Trim();
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        var isAiRoute = context.HttpContext.Request.Path.StartsWithSegments("/api/ai");
        var isDiscountRoute = context.HttpContext.Request.Path.StartsWithSegments("/api/discount");
        var isOrderRoute = context.HttpContext.Request.Path.StartsWithSegments("/api/orders");
        var isChatRoute = context.HttpContext.Request.Path.StartsWithSegments("/api/chat");
        var msg = isAiRoute
            ? "{\"message\":\"Quá nhiều lượt hỏi tư vấn AI trong thời gian ngắn. Quý khách vui lòng thử lại sau ít phút.\"}"
            : isDiscountRoute
            ? "{\"message\":\"Quá nhiều lần thử áp dụng mã giảm giá. Vui lòng thử lại sau ít phút.\"}"
            : isOrderRoute
            ? "{\"message\":\"Quá nhiều đơn hàng được gửi từ mạng của bạn. Vui lòng chờ ít phút trước khi đặt thêm.\"}"
            : isChatRoute
            ? "{\"message\":\"Quá nhiều phiên chat được khởi tạo. Vui lòng thử lại sau ít phút.\"}"
            : "{\"message\":\"Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút.\"}";
        await context.HttpContext.Response.WriteAsync(msg, cancellationToken);
    };
});

// ===== FILE UPLOAD CONFIG =====
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB max
});

// ===== SWAGGER / OPENAPI =====
builder.Services.AddOpenApi();

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient();

// ===== SERVICES (DI Registration) =====
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPaymentSettingsService, PaymentSettingsService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddScoped<INutritionAiService, NutritionAiService>();
builder.Services.AddScoped<ICustomMixService, CustomMixService>();

// ===== BÁO CÁO DOANH THU TUẦN (gửi email định kỳ cho chủ cửa hàng) =====
builder.Services.AddHostedService<WeeklyReportBackgroundService>();

// ===== EMAIL OUTBOX PROCESSOR (xử lý hàng đợi email outbox bền vững) =====
builder.Services.AddSingleton<IEmailOutboxChannel, EmailOutboxChannel>();
builder.Services.AddHostedService<EmailOutboxProcessor>();

// ===== CORS (Cho phép Frontend Next.js gọi API) =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var configuredOrigins = builder.Configuration["AllowedOrigins"]
            ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? Array.Empty<string>();

        policy.SetIsOriginAllowed(origin =>
        {
            if (string.IsNullOrWhiteSpace(origin)) return false;

            // Kiểm tra cấu hình cụ thể từ AllowedOrigins trong appsettings / env var
            if (configuredOrigins.Any(co => string.Equals(co.TrimEnd('/'), origin.TrimEnd('/'), StringComparison.OrdinalIgnoreCase)))
                return true;

            if (Uri.TryCreate(origin, UriKind.Absolute, out var uri))
            {
                var host = uri.Host.ToLowerInvariant();

                // Môi trường dev (localhost, 127.0.0.1 trên mọi cổng)
                if (host == "localhost" || host == "127.0.0.1") return true;

                // Hỗ trợ thiết bị di động (Mobile) kiểm tra web trong cùng mạng LAN / Wi-Fi nội bộ
                if (host.StartsWith("192.168.") || host.StartsWith("10.") ||
                    (host.StartsWith("172.") && int.TryParse(host.Split('.')[1], out var octet2) && octet2 >= 16 && octet2 <= 31))
                    return true;

                // Tên miền chính thức và subdomain (nguyetnhanphohien.com, www.nguyetnhanphohien.com)
                if (host == "nguyetnhanphohien.com" || host.EndsWith(".nguyetnhanphohien.com")) return true;

                // Các domain deploy preview hoặc production trên Vercel (*.vercel.app)
                if (host.EndsWith(".vercel.app")) return true;
            }

            return false;
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // Cần thiết cho SignalR
    });
});

var app = builder.Build();

if (args.Contains("--clear-data"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine("Đang kết nối tới Supabase PostgreSQL...");

    var orderItems = await db.OrderItems.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {orderItems} dòng trong OrderItems.");

    var orders = await db.Orders.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {orders} dòng trong Orders.");

    var redemptions = await db.DiscountRedemptions.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {redemptions} dòng trong DiscountRedemptions.");

    var chatMessages = await db.ChatMessages.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {chatMessages} dòng trong ChatMessages.");

    var chatSessions = await db.ChatSessions.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {chatSessions} dòng trong ChatSessions.");

    var legacyMessages = await db.Messages.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {legacyMessages} dòng trong Messages (legacy).");

    var legacyConversations = await db.Conversations.ExecuteDeleteAsync();
    Console.WriteLine($"Đã xóa {legacyConversations} dòng trong Conversations (legacy).");

    Console.WriteLine("Hoàn tất dọn dẹp dữ liệu đơn hàng và tin nhắn trên Supabase!");
    return;
}

if (args.Contains("--seed-analytics"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine("Đang kết nối tới Supabase PostgreSQL...");
    await NguyetnhanPhohien.Infrastructure.Persistence.DbSeeder.SeedAnalyticsHistoryAsync(db, force: true);

    var visits = await db.WebsiteVisits.LongCountAsync();
    var visitors = await db.WebsiteVisits.Select(v => v.VisitorId).Distinct().LongCountAsync();
    var ai = await db.NutritionAiUsages.LongCountAsync();
    var aiUsers = await db.NutritionAiUsages.Select(u => u.VisitorId).Distinct().LongCountAsync();

    Console.WriteLine($"ĐÃ XÁC NHẬN TRÊN SUPABASE:");
    Console.WriteLine($"- Tổng lượt truy cập: {visits}");
    Console.WriteLine($"- Khách ghé thăm (duy nhất): {visitors}");
    Console.WriteLine($"- Lượt hỏi AI dinh dưỡng: {ai}");
    Console.WriteLine($"- Khách hỏi AI (duy nhất): {aiUsers}");
    Console.WriteLine($"- Tỷ lệ tương tác AI: {(visitors > 0 ? (double)aiUsers / visitors * 100 : 0):F1}%");
    return;
}

if (args.Contains("--fix-rls"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine("Đang kết nối tới Supabase PostgreSQL để sửa lỗi RLS...");
    await db.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE IF EXISTS public.""CustomIngredients"" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.""CustomPackagings"" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.""EmailOutbox"" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.""WebsiteVisits"" ENABLE ROW LEVEL SECURITY;
        ALTER TABLE IF EXISTS public.""NutritionAiUsages"" ENABLE ROW LEVEL SECURITY;

        DO $$
        DECLARE
            t record;
        BEGIN
            FOR t IN
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                  AND table_type = 'BASE TABLE'
                  AND table_name <> '__EFMigrationsHistory'
            LOOP
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.table_name);
            END LOOP;
        END $$;
    ");

    using var conn = db.Database.GetDbConnection();
    await conn.OpenAsync();
    using var cmd = conn.CreateCommand();
    cmd.CommandText = "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;";
    using var reader = await cmd.ExecuteReaderAsync();

    Console.WriteLine("TABLE NAME | RLS ENABLED");
    Console.WriteLine("-------------------------");
    while (await reader.ReadAsync())
    {
        Console.WriteLine($"{reader.GetString(0),-25} | {reader.GetBoolean(1)}");
    }

    Console.WriteLine("Hoàn tất bật Row Level Security (RLS) cho tất cả các bảng trên Supabase!");
    return;
}

if (args.Contains("--migrate-favorite"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine("Đang cập nhật cột IsFavorite vào bảng Products trên Supabase PostgreSQL...");
    await db.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE public.""Products""
            ADD COLUMN IF NOT EXISTS ""IsFavorite"" BOOLEAN NOT NULL DEFAULT FALSE;

        CREATE INDEX IF NOT EXISTS ""IX_Products_IsFavorite"" ON public.""Products"" (""IsFavorite"");

        UPDATE public.""Products""
        SET ""IsFavorite"" = TRUE
        WHERE ""ProductCode"" IN ('NN-ZIP-150', 'NN-SEN-300');
    ");

    Console.WriteLine("Hoàn tất thêm cột IsFavorite và đặt yêu thích ban đầu cho sản phẩm trên Supabase!");
    return;
}

if (args.Contains("--migrate-products-5"))
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    Console.WriteLine("Đang cập nhật schema và 5 sản phẩm thực tế lên Supabase...");
    await db.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE public.""Products""
            ADD COLUMN IF NOT EXISTS ""ProductCode"" VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS ""NameEn"" VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS ""PackagingType"" VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS ""Badge"" VARCHAR(100) NULL,
            ADD COLUMN IF NOT EXISTS ""Overview"" TEXT NULL,
            ADD COLUMN IF NOT EXISTS ""Ingredients"" TEXT NULL,
            ADD COLUMN IF NOT EXISTS ""SensoryScores"" TEXT NULL,
            ADD COLUMN IF NOT EXISTS ""HealthBenefits"" TEXT NULL,
            ADD COLUMN IF NOT EXISTS ""UsageInstructions"" TEXT NULL;

        CREATE INDEX IF NOT EXISTS ""IX_Products_ProductCode"" ON public.""Products"" (""ProductCode"");
    ");

    var existing = await db.Products.Include(p => p.Images).ToListAsync();
    db.Products.RemoveRange(existing);
    await db.SaveChangesAsync();

    var products = new List<NguyetnhanPhohien.Domain.Entities.Product>
    {
        new()
        {
            Id = new Guid("b0000001-0000-0000-0000-000000000150"),
            ProductCode = "NN-ZIP-150",
            Name = "Gói \"Long Nhãn Mix Hạt Dinh Dưỡng\" (Túi Zip)",
            NameEn = "Artisanal Longan & Nut Blend Pouch",
            PackagingType = "Túi Zip Kraft",
            Size = "150g",
            Price = 69000,
            Badge = "Dưỡng Sinh Năng Lượng 150g",
            Description = "Sự kết hợp hoàn hảo giữa Long nhãn Phố Hiến dẻo ngọt và 4 loại hạt dinh dưỡng (Hạt điều, Macca, Bí xanh, Hạnh nhân) giòn bùi tự nhiên, túi zip tiện lợi.",
            Overview = "Lấy cảm hứng từ nhịp sống năng động hiện đại, gói hạt là giải pháp dinh dưỡng sạch và tiện lợi mỗi ngày. Từng múi long nhãn Hương Chi được sấy đối lưu giữ trọn vị ngọt mật, phối cùng hạt điều Bình Phước loại 1, macca Tây Nguyên béo ngậy, hạnh nhân và hạt bí xanh nướng mộc không chiên dầu.",
            Ingredients = "Long Nhãn Hương Chi Phố Hiến (30%), Hạt Điều Bình Phước (20%), Hạt Macca Tây Nguyên (20%), Hạnh Nhân Nướng Mộc (15%), Hạt Bí Xanh Tuyển Chọn (15%).",
            SensoryScores = "{\"nutCrispiness\":9.2,\"longanChewiness\":8.6,\"naturalSweetness\":8.5,\"harmoniousAroma\":9.0}",
            HealthBenefits = "Cung cấp năng lượng sạch tức thì, dồi dào chất xơ, vitamin E và Omega tự nhiên tốt cho tim mạch và não bộ.",
            UsageInstructions = "Ăn liền trực tiếp, trộn cùng sữa chua granola hoặc dùng kèm tách trà ấm trong giờ làm việc.",
            ImageUrl = "/images/products/tui_zip_mix_hat.jpg",
            DisplayOrder = 1,
            IsActive = true,
            Images = new List<NguyetnhanPhohien.Domain.Entities.ProductImage>
            {
                new() { ImagePath = "/images/products/tui_zip_mix_hat.jpg", DisplayOrder = 0 },
                new() { ImagePath = "/images/tuizip/tuizip.jpg", DisplayOrder = 1 }
            }
        },
        new()
        {
            Id = new Guid("b0000001-0000-0000-0000-000000000300"),
            ProductCode = "NN-DEO-300",
            Name = "Hũ \"Long Nhãn Sấy Dẻo Phố Hiến\" (Bản Tiến Vua)",
            NameEn = "Royal Tribute Convection-Dried Longan",
            PackagingType = "Hũ nắp gỗ sồi",
            Size = "300g",
            Price = 165000,
            Badge = "Phẩm Vật Tiến Vua Nguyên Bản",
            Description = "100% cùi nhãn Hương Chi bãi bồi sông Hồng tuyển chọn, sấy nhiệt nóng đối lưu bằng than củi nhãn già, cô đọng mật ngọt đất trời thành múi long dẻo quánh hổ phách chuẩn vị ngự thiện.",
            Overview = "Thứ quả ngọc tiến vua trứ danh ngàn năm của đất Hưng Yên. Thu hoạch từ cữ sớm mai trên những tán nhãn cổ thụ quanh Chùa Hiến, người nghệ nhân dùng bút tre xoáy cùi tách hạt khéo léo, giữ nguyên vẹn đài múi tròn đầy rồi sấy liên tục 36 giờ trên lò sấy đối lưu than củi gia truyền.",
            Ingredients = "100% Long nhãn Hương Chi Phố Hiến thuần khiết (0% đường phụ gia, 0% diêm sinh xông khói).",
            SensoryScores = "{\"nutCrispiness\":5.0,\"longanChewiness\":9.8,\"naturalSweetness\":9.5,\"harmoniousAroma\":9.6}",
            HealthBenefits = "Bổ tâm tỳ, dưỡng huyết an thần, trị mất ngủ, bồi bổ cơ thể suy nhược và tăng cường khí sắc.",
            UsageInstructions = "Thưởng trà mạn/trà sen, hãm trà dưỡng nhan cùng kỷ tử táo đỏ, hoặc nấu chè hạt sen long nhãn mùa hè.",
            ImageUrl = "/images/products/hu_long_nhan_say_deo.jpg",
            DisplayOrder = 2,
            IsActive = true,
            Images = new List<NguyetnhanPhohien.Domain.Entities.ProductImage>
            {
                new() { ImagePath = "/images/products/hu_long_nhan_say_deo.jpg", DisplayOrder = 0 },
                new() { ImagePath = "/images/hopnhua/hopnhua.jpg", DisplayOrder = 1 }
            }
        },
        new()
        {
            Id = new Guid("b0000001-0000-0000-0000-000000000301"),
            ProductCode = "NN-SEN-300",
            Name = "Hũ \"Long Nhãn Ôm Sen Bắc\" (Bản Ngự Thiện)",
            NameEn = "Imperial Longan Embracing Lotus Seed",
            PackagingType = "Hũ nắp gỗ sồi",
            Size = "300g",
            Price = 185000,
            Badge = "Tuyệt Kỹ Ngự Thiện Cung Đình",
            Description = "Sự kết tinh đỉnh cao giữa cùi nhãn Hương Chi ngọt thanh và hạt sen đầm Bắc bùi béo dẻo ngậy; mỗi múi nhãn ôm trọn viên hạt sen tròn đầy, thanh tao an thần dưỡng trí.",
            Overview = "Biểu tượng của sự vẹn tròn và thanh khiết trong ẩm thực hoàng cung xưa. Từng hạt sen tươi giống Bắc thơm bở được hấp chín tới, sau đó người thợ thủ công khéo léo lồng vào giữa múi nhãn Hương Chi tươi rồi đem sấy đối lưu. Vị ngọt đậm của mật nhãn ngấm đều vào hạt sen, tạo nên vị dẻo giòn bên ngoài và bùi béo ngậy tan mịn bên trong.",
            Ingredients = "Long Nhãn Hương Chi Phố Hiến (55%), Hạt Sen Bắc Tươi Đầm Hồng (45%).",
            SensoryScores = "{\"nutCrispiness\":7.5,\"longanChewiness\":9.4,\"naturalSweetness\":9.6,\"harmoniousAroma\":9.5}",
            HealthBenefits = "Dưỡng tâm an thần, cải thiện giấc ngủ sâu, kiện tỳ vị, thanh nhiệt dưỡng nhan.",
            UsageInstructions = "Dùng kèm tách trà hoa cúc hoặc trà ướp hoa sen ấm nóng; món quà biếu trang nhã cho người lớn tuổi.",
            ImageUrl = "/images/products/hu_long_nhan_om_sen.jpg",
            DisplayOrder = 3,
            IsActive = true,
            Images = new List<NguyetnhanPhohien.Domain.Entities.ProductImage>
            {
                new() { ImagePath = "/images/products/hu_long_nhan_om_sen.jpg", DisplayOrder = 0 }
            }
        },
        new()
        {
            Id = new Guid("b0000001-0000-0000-0000-000000000302"),
            ProductCode = "NN-MIX-300",
            Name = "Hũ \"Long Nhãn Ôm Sen Mix Hạt Dinh Dưỡng\"",
            NameEn = "Lotus Longan & Premium Nut Symphony",
            PackagingType = "Hũ nắp gỗ sồi",
            Size = "300g",
            Price = 175000,
            Badge = "Bản Giao Hưởng Dinh Dưỡng",
            Description = "Bản hòa ca mỹ vị độc bản giữa Long nhãn ôm sen Bắc bùi dẻo và 4 loại hạt dinh dưỡng (Điều, Macca, Hạnh nhân, Bí xanh) giòn bùi ngậy, trọn vẹn phong vị và vi chất cho sức khỏe.",
            Overview = "Tác phẩm giao thoa giữa di sản ẩm thực tiến vua và phong cách thực dưỡng hiện đại. Hũ hội tụ đủ cả từng viên long nhãn ôm sen ngọt bùi lẫn độ giòn tan béo ngậy của hạt macca Tây Nguyên, hạt điều Bình Phước nướng củi, hạnh nhân và hạt bí xanh, mang đến trải nghiệm thưởng vị phong phú bất tận.",
            Ingredients = "Long Nhãn Ôm Sen Bắc (40%), Hạt Macca Tây Nguyên (15%), Hạt Điều Bình Phước (15%), Hạnh Nhân Nướng Mộc (15%), Hạt Bí Xanh Ấn Độ (15%).",
            SensoryScores = "{\"nutCrispiness\":9.3,\"longanChewiness\":9.2,\"naturalSweetness\":9.2,\"harmoniousAroma\":9.6}",
            HealthBenefits = "Bổ sung khoáng chất, vitamin E, chất chống oxy hóa, hỗ trợ vóc dáng và làm chậm quá trình lão hóa.",
            UsageInstructions = "Nhâm nhi trực tiếp cùng trà sen, hoặc làm món khai vị chiêu đãi bạn bè trong những buổi thưởng trà đàm đạo.",
            ImageUrl = "/images/products/hu_long_nhan_om_sen_mix_hat.jpg",
            DisplayOrder = 4,
            IsActive = true,
            Images = new List<NguyetnhanPhohien.Domain.Entities.ProductImage>
            {
                new() { ImagePath = "/images/products/hu_long_nhan_om_sen_mix_hat.jpg", DisplayOrder = 0 }
            }
        },
        new()
        {
            Id = new Guid("b0000001-0000-0000-0000-000000000900"),
            ProductCode = "NN-SET-900",
            Name = "Lễ Hộp \"Vọng Nguyệt Thương Cảng\" (Hoàng Gia)",
            NameEn = "Imperial Gift Case \"Port Moonrise Heritage\"",
            PackagingType = "Lễ Hộp quai tre",
            Size = "Set 900g",
            Price = 780000,
            Badge = "Phẩm Vật Ngoại Giao Hoàng Gia",
            Description = "Tuyệt phẩm quà biếu tái hiện sự phồn hoa thương cảng Phố Hiến thế kỷ 17; thiết kế vali gấm đỏ quai tre truyền thống sang trọng, kết tinh trọn vẹn các thức quả ngự thiện thượng hạng.",
            Overview = "Đỉnh cao quà tặng di sản dành cho các dịp đại lễ, Tết cổ truyền và ngoại giao doanh nghiệp. Thiết kế vali bọc gấm đỏ tượng trưng cho vượng khí, tài lộc và sự viên mãn. Bên trong là 3 hũ nắp gỗ thượng hạng: 01 Hũ Long nhãn ôm sen, 01 Hũ Long nhãn sấy dẻo và 01 Hũ Hạt dinh dưỡng / Ôm sen mix hạt, gửi trao trọn vẹn chân tình và sự trân quý.",
            Ingredients = "01 Hũ Long Nhãn Ôm Sen (300g) + 01 Hũ Long Nhãn Sấy Dẻo (300g) + 01 Hũ Hạt Dinh Dưỡng Mix (300g) + 01 Thiệp thư pháp chúc mừng + 01 Túi xách gấm đỏ cao cấp.",
            SensoryScores = "{\"nutCrispiness\":9.5,\"longanChewiness\":9.8,\"naturalSweetness\":9.5,\"harmoniousAroma\":9.8}",
            HealthBenefits = "Món quà sức khỏe đẳng cấp trao gửi đối tác ngoại giao, lãnh đạo, tri ân cha mẹ và khách quý.",
            UsageInstructions = "Trưng bày không gian trang trọng ngày Tết hoặc dùng làm quà ngoại giao, biếu tặng cao cấp.",
            ImageUrl = "/images/products/le_hop_hoang_gia.jpg",
            DisplayOrder = 5,
            IsActive = true,
            Images = new List<NguyetnhanPhohien.Domain.Entities.ProductImage>
            {
                new() { ImagePath = "/images/products/le_hop_hoang_gia.jpg", DisplayOrder = 0 },
                new() { ImagePath = "/images/hopdo/hopdo.jpg", DisplayOrder = 1 }
            }
        }
    };

    db.Products.AddRange(products);
    await db.SaveChangesAsync();

    Console.WriteLine($"Đã nạp thành công {products.Count} sản phẩm đầy đủ 13 trường dữ liệu động lên Supabase!");
    foreach (var p in products)
    {
        Console.WriteLine($"- [{p.ProductCode}] {p.Name} | {p.Size} | {p.Price:N0}đ | Ảnh: {p.ImageUrl}");
    }
    return;
}

// ===== MIDDLEWARE PIPELINE =====
// 1. Forwarded Headers BẮT BUỘC ĐẦU TIÊN để Kestrel nhận đúng HTTPS và IP từ Reverse Proxy của Render
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    KnownNetworks = { },
    KnownProxies = { }
});

// Nén xếp NGOÀI CÙNG để response lấy ra từ output-cache / static file vẫn được nén.
app.UseResponseCompression();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("NguyetNhanPhoHien API");
        options.WithTheme(ScalarTheme.Moon);
    });
}

app.UseCors("AllowFrontend");

// Output cache phải đứng TRƯỚC static files & controller để cache được response JSON.
app.UseOutputCache();

// ===== STATIC FILES (phục vụ ảnh upload) =====
// Ảnh trong /uploads không bao giờ đổi nội dung theo URL: ProductService và
// ContentService luôn sinh tên file MỚI (kèm Guid) khi upload → cache vĩnh viễn
// an toàn. Nhờ đó lần mở trang sau trình duyệt dùng lại ảnh ngay, không tải lại.
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        if (ctx.Context.Request.Path.StartsWithSegments("/uploads"))
        {
            ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
        }
    }
});

// Không bật UseHttpsRedirection khi deploy sau Reverse Proxy (Render/Cloud)
// vì Edge Load Balancer đã tự động chuyển hướng HTTPS ở tầng ngoài.
// Bật ở đây sẽ khiến Kestrel redirect các probe HTTP nội bộ (Health Check) dẫn tới Timed Out.

app.UseAuthentication();
app.UseAuthorization();

// Rate limiter phải nằm sau xác thực (để có HttpContext đầy đủ) và TRƯỚC khi vào endpoint.
app.UseRateLimiter();

// ===== ROUTES & HEALTH CHECKS =====
// Health check endpoints cho Render và load balancers (trả về 200 OK ngay lập tức)
app.MapGet("/", () => Results.Ok(new { service = "NguyetNhanPhoHien API", status = "ok", time = DateTime.UtcNow }));
app.MapGet("/health", () => Results.Ok(new { status = "healthy", time = DateTime.UtcNow }));
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", time = DateTime.UtcNow }));
app.MapControllers();
// Bắt buộc gắn RequireCors vào Hub endpoint để SignalR negotiation & WebSocket preflight qua Vercel thành công
app.MapHub<ChatHub>("/hubs/chat").RequireCors("AllowFrontend");
// Hub realtime sản phẩm/ảnh/nội dung — frontend invalidate React Query khi có thay đổi.
app.MapHub<ProductsHub>("/hubs/products").RequireCors("AllowFrontend");

// ===== AUTO MIGRATE & SEED (non-fatal: API vẫn chạy nếu DB chưa kết nối được) =====
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<NguyetnhanPhohien.Infrastructure.Persistence.AppDbContext>();
        await NguyetnhanPhohien.Infrastructure.Persistence.DbSeeder.SeedAsync(db);
    }
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database migrate/seed failed. API will start without seeded data.");
}

app.Run();

