using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.Chat;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hub;
    private readonly IHubContext<ProductsHub> _eventsHub;
    private readonly ILogger<ChatController> _logger;

    public ChatController(
        IChatService chatService,
        IHubContext<ChatHub> hub,
        IHubContext<ProductsHub> eventsHub,
        ILogger<ChatController> logger)
    {
        _chatService = chatService;
        _hub = hub;
        _eventsHub = eventsHub;
        _logger = logger;
    }

    /// <summary>
    /// Báo cho group Admin rằng danh sách/trạng thái phiên chat đã đổi, để trang
    /// Tổng quan (số phiên, số chưa đọc) tự tải lại thay vì phải F5.
    /// Lỗi broadcast KHÔNG làm fail request đã ghi DB thành công.
    /// </summary>
    private async Task NotifySessionsChangedAsync(string action)
    {
        try
        {
            await _eventsHub.Clients.Group(ProductsHub.AdminGroup)
                .SendAsync(ProductsHub.SessionsChangedEvent, new { action, at = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không broadcast được sự kiện phiên chat {Action}", action);
        }
    }

    /// <summary>
    /// [PUBLIC] Khách bắt đầu phiên chat: server sinh SessionId ngẫu nhiên và trả về
    /// token truy cập phiên. Client tự đặt SessionId trước đây khiến ai biết/đoán được
    /// id của người khác là đọc được tin nhắn Admin trả lời cho người đó.
    /// </summary>
    [HttpPost("session")]
    public async Task<IActionResult> CreateSession([FromBody] CreateSessionRequest? request)
    {
        var credentials = await _chatService.CreateGuestSessionAsync(request?.GuestName, request?.GuestPhone);
        await NotifySessionsChangedAsync("created");
        return Ok(credentials);
    }

    /// <summary>
    /// [PUBLIC] Khách lấy lịch sử tin nhắn của phiên mình (CHỈ ĐỌC — không tạo phiên mới).
    /// Yêu cầu token phiên qua header X-Chat-Token (không để trong URL vì URL bị ghi log).
    /// </summary>
    [HttpGet("messages/{sessionId}")]
    public async Task<IActionResult> GetGuestMessages(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > ChatRules.SessionIdMaxLength)
            return BadRequest("SessionId không hợp lệ.");

        if (!_chatService.IsSessionTokenValid(sessionId, Request.Headers["X-Chat-Token"].FirstOrDefault()))
            return Unauthorized(new { message = "Phiên chat không hợp lệ hoặc đã hết hiệu lực." });

        var session = await _chatService.FindSessionAsync(sessionId);
        if (session == null)
            return NotFound(new { message = "Phiên chat không tồn tại." });

        var messages = await _chatService.GetSessionMessagesAsync(session.Id);
        return Ok(messages);
    }

    /// <summary>
    /// [PUBLIC] Khách gửi tin nhắn qua REST — fallback khi WebSocket/SignalR bị chặn
    /// (mạng công ty, proxy cũ...). Trả về tin nhắn đã lưu để client hiển thị ngay.
    /// Đồng thời broadcast qua SignalR để admin đang online thấy ngay (realtime 2 đường).
    /// Bắt buộc kèm sessionToken do POST /api/chat/session cấp.
    /// </summary>
    [HttpPost("messages")]
    public async Task<IActionResult> SendGuestMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var result = await _chatService.SendGuestMessageAsync(
                request.SessionId, request.SessionToken, request.Content, request.GuestName, request.GuestPhone);

            await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("ReceiveGuestMessage", new
            {
                sessionId = result.Session.Id,
                message = result.Message
            });

            await NotifySessionsChangedAsync("message");

            return Ok(result.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
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

        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > ChatRules.MaxMessageLength)
            return BadRequest(new { message = $"Tin nhắn rỗng hoặc vượt quá {ChatRules.MaxMessageLength} ký tự." });

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

        await NotifySessionsChangedAsync("message");

        return Ok(message);
    }

    /// <summary>
    /// [PUBLIC] Khách xác nhận đã xem tin nhắn của Admin (read receipt).
    /// Broadcast về group các Admin để hiện “Đã xem” realtime.
    /// Cũng yêu cầu token phiên — nếu không, người lạ đọc được ảnh hưởng trạng thái
    /// "đã xem" của khách khác.
    /// </summary>
    [HttpPut("messages/{sessionId}/read")]
    public async Task<IActionResult> MarkGuestRead(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > ChatRules.SessionIdMaxLength)
            return BadRequest("SessionId không hợp lệ.");

        if (!_chatService.IsSessionTokenValid(sessionId, Request.Headers["X-Chat-Token"].FirstOrDefault()))
            return Unauthorized(new { message = "Phiên chat không hợp lệ hoặc đã hết hiệu lực." });

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

        await NotifySessionsChangedAsync("resolved");

        return Ok(session);
    }

    /// <summary>
    /// [ADMIN] Xoá hẳn một phiên chat kèm toàn bộ tin nhắn của phiên.
    /// Xoá xong broadcast "SessionDeleted":
    ///   - tới các tab Admin để bỏ phiên khỏi danh sách ngay (không phải F5),
    ///   - tới group phiên của khách để widget đang mở tự xin phiên mới, thay vì
    ///     gửi tin tiếp rồi nhận lỗi "Phiên chat không tồn tại".
    /// </summary>
    [HttpDelete("sessions/{sessionId:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        var session = await _chatService.DeleteSessionAsync(sessionId);
        if (session == null)
            return NotFound(new { message = "Phiên chat không tồn tại." });

        var notification = new { sessionId = session.Id, sessionKey = session.SessionId };

        await _hub.Clients.Group(ChatHub.AdminGroup).SendAsync("SessionDeleted", notification);

        // Khách join CẢ group theo Guid (DB) lẫn theo SessionId do server cấp
        await _hub.Clients.Group(ChatHub.GroupFor(session.Id.ToString()))
            .SendAsync("SessionDeleted", notification);
        await _hub.Clients.Group(ChatHub.GroupFor(session.SessionId))
            .SendAsync("SessionDeleted", notification);

        await NotifySessionsChangedAsync("deleted");

        return NoContent();
    }
}
