using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using NguyetnhanPhohien.Application.DTOs.Ai;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/ai/nutrition")]
[EnableRateLimiting("ai-nutrition")]
public class NutritionAiController : ControllerBase
{
    private readonly INutritionAiService _nutritionAiService;
    private readonly ILogger<NutritionAiController> _logger;

    public NutritionAiController(
        INutritionAiService nutritionAiService,
        ILogger<NutritionAiController> logger)
    {
        _nutritionAiService = nutritionAiService;
        _logger = logger;
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
                new { @event = "error", message = "Đã xảy ra lỗi khi tạo phản hồi." },
                new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase });
            await Response.WriteAsync($"data: {errPayload}\n\n", cancellationToken);
        }
    }
}
