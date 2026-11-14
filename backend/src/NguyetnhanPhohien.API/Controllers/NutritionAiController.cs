using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Ai;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;
using NguyetnhanPhohien.Infrastructure.Services;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/ai/nutrition")]
[EnableRateLimiting("ai-nutrition")]
public class NutritionAiController : ControllerBase
{
    private readonly INutritionAiService _nutritionAiService;
    private readonly AppDbContext _db;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<ProductsHub> _hubContext;
    private readonly ILogger<NutritionAiController> _logger;

    public NutritionAiController(
        INutritionAiService nutritionAiService,
        AppDbContext db,
        IMemoryCache cache,
        IHubContext<ProductsHub> hubContext,
        ILogger<NutritionAiController> logger)
    {
        _nutritionAiService = nutritionAiService;
        _db = db;
        _cache = cache;
        _hubContext = hubContext;
        _logger = logger;
    }

    private async Task LogAiUsageAsync(NutritionConsultationRequest request)
    {
        try
        {
            var preview = (request.Message ?? string.Empty).Trim();
            if (preview.Length > 200) preview = preview[..200] + "...";

            var usage = new NutritionAiUsage
            {
                Id = Guid.NewGuid(),
                QuestionPreview = preview,
                Language = string.Equals(request.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "vi",
                CreatedAt = DateTime.UtcNow
            };

            _db.NutritionAiUsages.Add(usage);
            await _db.SaveChangesAsync();

            // Xóa cache dashboard và phát sự kiện realtime
            _cache.Remove(DashboardService.CacheKey);
            try
            {
                await _hubContext.Clients.All.SendAsync(ProductsHub.AnalyticsChangedEvent);
            }
            catch (Exception hubEx)
            {
                _logger.LogWarning(hubEx, "Không thể phát sự kiện SignalR AnalyticsChanged từ NutritionAiController.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không thể ghi nhận lượt sử dụng AI vào database.");
        }
    }

    /// <summary>
    /// Tư vấn dinh dưỡng và gợi ý sản phẩm mix hạt theo thể trạng người dùng.
    /// </summary>
    [HttpPost("consult")]
    public async Task<ActionResult<NutritionConsultationResponse>> Consult(
        [FromBody] NutritionConsultationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Nội dung câu hỏi không được để trống." });
        }

        await LogAiUsageAsync(request);
        var response = await _nutritionAiService.ConsultAsync(request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// Streaming SSE trả lời tư vấn dinh dưỡng theo thời gian thực (hiệu ứng chữ chạy từng từ).
    /// </summary>
    [HttpPost("stream")]
    public async Task StreamConsult(
        [FromBody] NutritionConsultationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            Response.StatusCode = StatusCodes.Status400BadRequest;
            await Response.WriteAsync("data: {\"error\": \"Nội dung câu hỏi không được để trống.\"}\n\n", cancellationToken);
            return;
        }

        await LogAiUsageAsync(request);

        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers.Append("Cache-Control", "no-cache, no-transform");
        Response.Headers.Append("X-Accel-Buffering", "no");

        try
        {
            await foreach (var chunk in _nutritionAiService.StreamConsultAsync(request, cancellationToken))
            {
                await Response.WriteAsync($"data: {chunk}\n\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }

            await Response.WriteAsync("data: [DONE]\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            // Client ngắt kết nối giữa chừng, bỏ qua
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi xảy ra trong quá trình stream SSE tư vấn dinh dưỡng.");
            var errPayload = System.Text.Json.JsonSerializer.Serialize(
                new { @event = "error", message = string.Equals(request.Language, "en", StringComparison.OrdinalIgnoreCase)
                    ? "An error occurred while generating the response."
                    : "Đã xảy ra lỗi khi tạo phản hồi." },
                new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await Response.WriteAsync($"data: {errPayload}\n\n", cancellationToken);
        }
    }
}
