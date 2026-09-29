using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Hubs;

/// <summary>
/// Hub SignalR cho Live Chat giữa Khách hàng (Guest) và Admin.
/// 
/// Luồng:
///   1. Khách kết nối vào hub, gửi sessionId (lưu trong cookie/localStorage phía client).
///   2. Khách gửi tin nhắn -> Hub lưu DB, broadcast đến Admin group.
///   3. Admin gửi reply -> Hub lưu DB, gửi về đúng session của khách.
/// </summary>
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private const string AdminGroup = "Admins";

    public ChatHub(IChatService chatService)
    {
        _chatService = chatService;
    }

    /// <summary>
    /// Khách hàng đăng ký session khi kết nối vào hub.
    /// </summary>
    public async Task JoinAsGuest(string sessionId, string? guestName, string? guestPhone)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"session_{sessionId}");
        await _chatService.GetOrCreateSessionAsync(sessionId, guestName, guestPhone);
    }

    /// <summary>
    /// Admin kết nối vào Admin group để nhận tất cả tin nhắn từ mọi phiên.
    /// </summary>
    public async Task JoinAsAdmin()
    {
        // Trong thực tế nên verify token ở đây, tạm thời để đơn giản
        await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
    }

    /// <summary>
    /// Khách gửi tin nhắn lên server.
    /// </summary>
    public async Task SendGuestMessage(string sessionId, string content)
    {
        var session = await _chatService.GetOrCreateSessionAsync(sessionId, null, null);
        var message = await _chatService.SaveMessageAsync(session.Id, content, "Guest");

        // Gửi đến Admin group
        await Clients.Group(AdminGroup).SendAsync("ReceiveGuestMessage", new
        {
            sessionId = session.Id,
            message
        });

        // Echo lại cho chính khách đó (xác nhận tin đã gửi)
        await Clients.Caller.SendAsync("MessageSent", message);
    }

    /// <summary>
    /// Admin reply tin nhắn cho khách.
    /// </summary>
    public async Task AdminReply(AdminReplyRequest request)
    {
        var message = await _chatService.SaveMessageAsync(request.ChatSessionId, request.Content, "Admin");

        // Lấy session để biết gửi về group nào
        var messages = await _chatService.GetSessionMessagesAsync(request.ChatSessionId);

        // Gửi về group của phiên chat đó
        await Clients.Group($"session_{request.ChatSessionId}").SendAsync("ReceiveAdminMessage", message);

        // Cũng thông báo đến Admin group (để update UI)
        await Clients.Group(AdminGroup).SendAsync("AdminReplied", new
        {
            sessionId = request.ChatSessionId,
            message
        });
    }
}
