using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hub;

    public ChatController(IChatService chatService, IHubContext<ChatHub> hub)
    {
        _chatService = chatService;
        _hub = hub;
    }

    /// <summary>
    /// [PUBLIC] Khách lấy lịch sử tin nhắn của session mình.
    /// </summary>
    [HttpGet("messages/{sessionId}")]
    public async Task<IActionResult> GetGuestMessages(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 100)
            return BadRequest("SessionId không hợp lệ.");

        var session = await _chatService.GetOrCreateSessionAsync(sessionId, null, null);
        var messages = await _chatService.GetSessionMessagesAsync(session.Id);
        return Ok(messages);
    }

    /// <summary>
    /// [PUBLIC] Khách gửi tin nhắn qua REST — fallback khi WebSocket/SignalR bị chặn
    /// (mạng công ty, proxy cũ...). Trả về tin nhắn đã lưu để client hiển thị ngay.
    /// Đồng thời broadcast qua SignalR để admin đang online thấy ngay (realtime 2 đường).
    /// </summary>
    [HttpPost("messages")]
    public async Task<IActionResult> SendGuestMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var result = await _chatService.SendGuestMessageAsync(
                request.SessionId, request.Content, request.GuestName, request.GuestPhone);

            await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("ReceiveGuestMessage", new
            {
                sessionId = result.Session.Id,
                message = result.Message
            });

            return Ok(result.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// [ADMIN] Trả lời khách qua REST — fallback khi WebSocket/SignalR bị chặn.
    /// Cùng logic với ChatHub.AdminReply: lưu DB, báo khách nhận tin, báo các tab Admin.
    /// </summary>
    [HttpPost("admin-reply")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AdminReply([FromBody] AdminReplyRequest request)
    {
        if (request.ChatSessionId == Guid.Empty)
            return BadRequest(new { message = "Phiên chat không hợp lệ." });

        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > 2000)
            return BadRequest(new { message = "Tin nhắn rỗng hoặc vượt quá 2000 ký tự." });

        ChatMessageResponse message;
        try
        {
            message = await _chatService.SaveMessageAsync(request.ChatSessionId, request.Content.Trim(), "Admin");
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }

        // Admin trả lời => phiên này đã đọc hết tin của khách
        await _chatService.MarkSessionReadAsync(request.ChatSessionId);

        var sessionGroup = ChatHub.GroupFor(request.ChatSessionId.ToString());
        await _hub.Clients.Group(sessionGroup).SendAsync("ReceiveAdminMessage", message);
        await _hub.Clients.Group(sessionGroup).SendAsync("MessagesRead", new { sessionId = request.ChatSessionId });
        await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("AdminReplied", new
        {
            sessionId = request.ChatSessionId,
            message
        });

        return Ok(message);
    }

    /// <summary>
    /// [PUBLIC] Khách xác nhận đã xem tin nhắn của Admin (read receipt).
    /// Broadcast về group các Admin để hiện “Đã xem” realtime.
    /// </summary>
    [HttpPut("messages/{sessionId}/read")]
    public async Task<IActionResult> MarkGuestRead(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 100)
            return BadRequest("SessionId không hợp lệ.");

        var chatSessionId = await _chatService.MarkMessagesReadByGuestAsync(sessionId);
        if (chatSessionId == null)
            return NotFound("Phiên chat không tồn tại.");

        await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("GuestReadMessages", new
        {
            sessionId = chatSessionId.Value
        });

        return NoContent();
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
    /// [ADMIN] Đánh dấu phiên đã đọc — báo luôn cho khách biết tin của họ đã được xem.
    /// </summary>
    [HttpPut("sessions/{sessionId:guid}/read")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> MarkRead(Guid sessionId)
    {
        await _chatService.MarkSessionReadAsync(sessionId);

        await _hub.Clients.Group(ChatHub.GroupFor(sessionId.ToString()))
            .SendAsync("MessagesRead", new { sessionId });

        return NoContent();
    }

    /// <summary>
    /// [ADMIN] Mở/đóng phiên chat — đánh dấu đã phân giải (isResolved=true) hoặc mở lại (false).
    /// Broadcast "SessionResolved" để các tab admin khác cập nhật danh sách/bộ lọc realtime.
    /// </summary>
    [HttpPut("sessions/{sessionId:guid}/resolve")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetResolved(Guid sessionId, [FromQuery] bool isResolved = true)
    {
        var session = await _chatService.SetSessionResolvedAsync(sessionId, isResolved);
        if (session == null)
            return NotFound(new { message = "Phiên chat không tồn tại." });

        await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("SessionResolved", new
        {
            sessionId = session.Id,
            isResolved = session.IsResolved,
            hasUnreadMessages = session.HasUnreadMessages
        });

        return Ok(session);
    }
}
