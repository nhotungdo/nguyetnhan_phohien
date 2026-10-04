using NguyetnhanPhohien.Application.DTOs.Chat;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IChatService
{
    Task<ChatSessionResponse> GetOrCreateSessionAsync(string sessionId, string? guestName, string? guestPhone);
    Task<ChatMessageResponse> SaveMessageAsync(Guid sessionId, string content, string senderType);
    Task<IEnumerable<ChatSessionResponse>> GetAllSessionsAsync();
    Task<IEnumerable<ChatMessageResponse>> GetSessionMessagesAsync(Guid sessionId);

    /// <summary>
    /// [ADMIN đọc] Đánh dấu tin của khách đã đọc + bỏ cờ chưa đọc trên phiên.
    /// </summary>
    Task MarkSessionReadAsync(Guid sessionId);

    /// <summary>
    /// [KHÁCH đọc] Đánh dấu tin của Admin đã khách xem (read receipt).
    /// Trả về Id phiên chat hoặc null nếu session chưa tồn tại.
    /// </summary>
    Task<Guid?> MarkMessagesReadByGuestAsync(string sessionId);

    /// <summary>
    /// [ADMIN] Mở/đóng phiên chat (đã phân giải hay chưa).
    /// Đóng phiên đồng thời bỏ cờ chưa đọc. Trả về phiên sau khi cập nhật, null nếu không tồn tại.
    /// </summary>
    Task<ChatSessionResponse?> SetSessionResolvedAsync(Guid sessionId, bool isResolved);

    /// <summary>
    /// Khách gửi tin nhắn qua REST (fallback khi SignalR lỗi).
    /// Validate + tạo session nếu chưa có + lưu tin nhắn.
    /// </summary>
    Task<GuestChatMessageResponse> SendGuestMessageAsync(string sessionId, string content, string? guestName, string? guestPhone);
}
