using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
    throw new InvalidOperationException(
        "Jwt:Key chưa được cấu hình (dùng user-secrets hoặc biến môi trường Jwt__Key). App dừng lại thay vì chạy với key rỗng.");
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
        // Ưu tiên đọc client IP từ header X-Forwarded-For (hữu ích khi sau reverse proxy / NAT / CDN)
        var clientIp = context.Request.Headers["X-Forwarded-For"].FirstOrDefault()?.Split(',')[0]?.Trim();
        if (string.IsNullOrEmpty(clientIp))
        {
            clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
            {
                PermitLimit = 20, // Nâng lên 20 lượt/phút để tránh chặn nhầm nhiều khách chung mạng Wi-Fi/NAT
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json; charset=utf-8";
        var isAiRoute = context.HttpContext.Request.Path.StartsWithSegments("/api/ai");
        var msg = isAiRoute
            ? "{\"message\":\"Quá nhiều lượt hỏi tư vấn AI trong thời gian ngắn. Quý khách vui lòng thử lại sau ít phút.\"}"
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

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

// Rate limiter phải nằm sau xác thực (để có HttpContext đầy đủ) và TRƯỚC khi vào endpoint.
app.UseRateLimiter();

// ===== ROUTES =====
// Scalar UI chỉ được map ở môi trường Development → ở production route "/" trỏ vào
// /scalar/v1 sẽ trả 404. Production trả JSON thông tin API thay vì redirect chết.
if (app.Environment.IsDevelopment())
    app.MapGet("/", (HttpContext context) => context.Response.Redirect("/scalar/v1"));
else
    app.MapGet("/", () => Results.Ok(new { service = "NguyetNhanPhoHien API", status = "ok" }));
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

