using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;
using NguyetnhanPhohien.Infrastructure.Services;

namespace NguyetnhanPhohien.API.Controllers;

public class TrackVisitRequest
{
    public string? Path { get; set; }
    public string? VisitorId { get; set; }
    public string? Referrer { get; set; }
    public string? DeviceType { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<ProductsHub> _hubContext;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(
        AppDbContext db,
        IMemoryCache cache,
        IHubContext<ProductsHub> hubContext,
        ILogger<AnalyticsController> logger)
    {
        _db = db;
        _cache = cache;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Ghi nhận lượt truy cập trang web (Ẩn danh, không lưu PII người dùng).
    /// </summary>
    [HttpPost("track-visit")]
    public async Task<IActionResult> TrackVisit([FromBody] TrackVisitRequest request)
    {
        try
        {
            var rawPath = (request.Path ?? "/").Trim();
            if (string.IsNullOrEmpty(rawPath)) rawPath = "/";

            // Bỏ qua tracking các trang nội bộ của Admin
            if (rawPath.StartsWith("/dashboard", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/analytics", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/orders", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/messenger", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/content", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/products", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/discounts", StringComparison.OrdinalIgnoreCase) ||
                rawPath.StartsWith("/payment", StringComparison.OrdinalIgnoreCase))
            {
                return Ok(new { success = true, skipped = true });
            }

            var visitorId = (request.VisitorId ?? string.Empty).Trim();
            if (string.IsNullOrEmpty(visitorId))
            {
                visitorId = Guid.NewGuid().ToString("N");
            }

            // Băm SHA-256 IP để bảo mật quyền riêng tư người dùng
            string? ipHash = null;
            var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
            if (!string.IsNullOrEmpty(ip))
            {
                using var sha = SHA256.Create();
                var hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(ip + "nguyetnhan_salt_2026"));
                ipHash = Convert.ToHexString(hashBytes)[..16];
            }

            var visit = new WebsiteVisit
            {
                Id = Guid.NewGuid(),
                Path = rawPath.Length > 255 ? rawPath[..255] : rawPath,
                VisitorId = visitorId.Length > 64 ? visitorId[..64] : visitorId,
                IpHash = ipHash,
                DeviceType = string.IsNullOrWhiteSpace(request.DeviceType) ? "Desktop" : request.DeviceType.Trim(),
                Referrer = string.IsNullOrWhiteSpace(request.Referrer) ? null : (request.Referrer.Length > 500 ? request.Referrer[..500] : request.Referrer),
                CreatedAt = DateTime.UtcNow
            };

            _db.WebsiteVisits.Add(visit);
            await _db.SaveChangesAsync();

            // Xóa cache dashboard để lần query tiếp theo luôn đọc số liệu thực mới nhất từ database
            _cache.Remove(DashboardService.CacheKey);

            // Bắn tín hiệu SignalR realtime cho quản trị viên đang mở trang
            try
            {
                await _hubContext.Clients.All.SendAsync(ProductsHub.AnalyticsChangedEvent);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể phát sự kiện SignalR AnalyticsChanged.");
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi ghi nhận lượt truy cập website.");
            return Ok(new { success = false }); // Trả 200 để không làm ảnh hưởng trải nghiệm duyệt web
        }
    }
}
