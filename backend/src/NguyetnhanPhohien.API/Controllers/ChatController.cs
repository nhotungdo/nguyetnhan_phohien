using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// [PUBLIC] Khách lấy lịch sử tin nhắn của session mình.
    /// </summary>
    [HttpGet("messages/{sessionId}")]
    public async Task<IActionResult> GetGuestMessages(string sessionId)
    {
        var session = await _chatService.GetOrCreateSessionAsync(sessionId, null, null);
        var messages = await _chatService.GetSessionMessagesAsync(session.Id);
        return Ok(messages);
    }

    /// <summary>
    /// [ADMIN] Lấy danh sách tất cả phiên chat.
    /// </summary>
    [HttpGet("sessions")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllSessions()
    {
        var sessions = await _chatService.GetAllSessionsAsync();
        return Ok(sessions);
    }

    /// <summary>
    /// [ADMIN] Xem chi tiết tin nhắn của 1 phiên chat.
    /// </summary>
    [HttpGet("sessions/{sessionId:guid}/messages")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSessionMessages(Guid sessionId)
    {
        var messages = await _chatService.GetSessionMessagesAsync(sessionId);
        return Ok(messages);
    }

    /// <summary>
    /// [ADMIN] Đánh dấu phiên đã đọc.
    /// </summary>
    [HttpPut("sessions/{sessionId:guid}/read")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkRead(Guid sessionId)
    {
        await _chatService.MarkSessionReadAsync(sessionId);
        return NoContent();
    }
}
