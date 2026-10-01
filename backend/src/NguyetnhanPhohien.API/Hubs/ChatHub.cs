using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Hubs;

/// <summary>
/// Hub SignalR cho Live Chat giữa Khách hàng (Guest) và Admin.
///
/// Phân quyền:
///   - Khách: KHÔNG cần đăng nhập, chỉ join được group phiên chat của chính mình.
///   - Admin: BẮT BUỘC JWT (role Admin) mới gọi được JoinAsAdmin / AdminReply.
///     Token được client truyền qua access_token trên query string (đã cấu hình trong Program.cs).
///
/// Luồng:
///   1. Khách kết nối vào hub, gửi sessionId (chuỗi tùy ý lưu ở sessionStorage phía client).
///   2. Khách join group "session_{sessionId}" VÀ "session_{sessionGuid}" (Guid trong DB)
///      để nhận được tin nhắn từ admin bất kể admin gửi theo key nào.
///   3. Khách gửi tin nhắn -> Hub lưu DB, broadcast đến Admin group.
///   4. Admin reply -> Hub lưu DB, gửi về đúng group phiên chat của khách.
///
/// LƯU Ý QUAN TRỌNG: KHÔNG gắn [Authorize] ở cấp Hub class. Với JWT bearer,
/// middleware xác thực chạy ở handshake — nếu yêu cầu Auth cấp Hub thì khách chưa
/// đăng nhập sẽ bị 401 ngay khi kết nối, và [AllowAnonymous] trên hub method
/// KHÔNG cứu được (khác với MVC controller). Admin vẫn bị chặn riêng ở từng
/// method JoinAsAdmin / AdminReply bằng [Authorize(Roles = "Admin")].
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
    /// Khách hàng đăng ký session khi kết nối vào hub (PUBLIC — không cần đăng nhập).
    /// Join CẢ 2 group: theo chuỗi sessionId client tự sinh và theo Guid trong DB,
    /// để admin có thể gửi theo key nào cũng tới được khách.
    /// </summary>
    [AllowAnonymous]
    public async Task JoinAsGuest(string sessionId, string? guestName, string? guestPhone)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 128)
            throw new HubException("SessionId không hợp lệ.");

        // Group theo chuỗi sessionId do client sinh (ổn định qua reconnect)
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupFor(sessionId));

        // Group theo Guid phiên chat trong DB (key mà AdminReply đang dùng)
        var session = await _chatService.GetOrCreateSessionAsync(sessionId, guestName, guestPhone);
        await Groups.AddToGroupAsync(Context.ConnectionId, GroupFor(session.Id.ToString()));
    }

    /// <summary>
    /// Admin kết nối vào Admin group để nhận tất cả tin nhắn từ mọi phiên.
    /// Yêu cầu JWT với role Admin.
    /// </summary>
    [Authorize(Roles = "Admin")]
    public async Task JoinAsAdmin()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
    }

    /// <summary>Key group chuẩn cho một phiên chat.</summary>
    public static string GroupFor(string key) => $"session_{key}";

    /// <summary>
    /// Khách gửi tin nhắn lên server (PUBLIC — không cần đăng nhập).
    /// </summary>
    [AllowAnonymous]
    public async Task SendGuestMessage(string sessionId, string content)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 128)
            throw new HubException("SessionId không hợp lệ.");

        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
            throw new HubException("Tin nhắn rỗng hoặc vượt quá 2000 ký tự.");

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
    /// Admin reply tin nhắn cho khách. Yêu cầu JWT với role Admin.
    /// </summary>
    [Authorize(Roles = "Admin")]
    public async Task AdminReply(AdminReplyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content) || request.Content.Length > 2000)
            throw new HubException("Tin nhắn rỗng hoặc vượt quá 2000 ký tự.");

        var message = await _chatService.SaveMessageAsync(request.ChatSessionId, request.Content, "Admin");

        // Gửi về group của phiên chat đó (khách đã join group này ở JoinAsGuest)
        await Clients.Group(GroupFor(request.ChatSessionId.ToString())).SendAsync("ReceiveAdminMessage", message);

        // Cũng thông báo đến Admin group (để update UI)
        await Clients.Group(AdminGroup).SendAsync("AdminReplied", new
        {
            sessionId = request.ChatSessionId,
            message
        });
    }
}
