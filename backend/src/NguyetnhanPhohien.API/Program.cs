using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key chưa được cấu hình trong appsettings.");

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

// ===== STATIC FILES (phục vụ ảnh upload) =====
app.UseStaticFiles();

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

