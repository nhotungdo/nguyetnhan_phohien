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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
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
builder.Services.AddSignalR();

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

// ===== FILE UPLOAD CONFIG =====
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB max
});

// ===== SWAGGER / OPENAPI =====
builder.Services.AddOpenApi();

// ===== SERVICES (DI Registration) =====
builder.Services.AddScoped<IDiscountService, DiscountService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IContentService, ContentService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IEmailService, EmailService>();

// ===== BÁO CÁO DOANH THU TUẦN (gửi email định kỳ cho chủ cửa hàng) =====
builder.Services.AddHostedService<WeeklyReportBackgroundService>();

// ===== CORS (Cho phép Frontend Next.js gọi API) =====
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration["AllowedOrigins"]
            ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            ?? new[] { "http://localhost:3000" };
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Cần thiết cho SignalR
    });
});

var app = builder.Build();

// ===== MIDDLEWARE PIPELINE =====
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

// ===== ROUTES =====
app.MapGet("/", (HttpContext context) => context.Response.Redirect("/scalar/v1"));
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
// Hub realtime sản phẩm/ảnh/nội dung — frontend invalidate React Query khi có thay đổi.
app.MapHub<ProductsHub>("/hubs/products");

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

