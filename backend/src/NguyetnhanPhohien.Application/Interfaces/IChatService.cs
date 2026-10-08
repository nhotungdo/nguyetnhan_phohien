using NguyetnhanPhohien.Application.DTOs.Chat;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IChatService
{
    /// <summary>
    /// [PUBLIC] Khách bắt đầu phiên chat: server sinh SessionId ngẫu nhiên và trả về
    /// token truy cập phiên. Client KHÔNG tự đặt SessionId (tránh chiếm phiên người khác).
    /// </summary>
    Task<ChatSessionCredentialsResponse> CreateGuestSessionAsync(string? guestName, string? guestPhone);

    /// <summary>
    /// Tìm phiên theo SessionId (CHỈ ĐỌC — không tạo mới), cập nhật tên/SĐT nếu được cung cấp.
    /// Trả về null nếu phiên không tồn tại.
    /// </summary>
    Task<ChatSessionResponse?> FindSessionAsync(string sessionId, string? guestName = null, string? guestPhone = null);

    /// <summary>
    /// Kiểm tra token khách gửi lên có đúng là token của phiên này không.
    /// Mọi đường truy cập của khách (hub, REST) PHẢI gọi hàm này trước khi đọc/ghi phiên.
    /// </summary>
    bool IsSessionTokenValid(string sessionId, string? sessionToken);

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
    /// Caller (ChatController) phải verify token phiên trước khi gọi.
    /// </summary>
    Task<Guid?> MarkMessagesReadByGuestAsync(string sessionId);

    /// <summary>
    /// [ADMIN] Mở/đóng phiên chat (đã phân giải hay chưa).
    /// Đóng phiên đồng thời bỏ cờ chưa đọc. Trả về phiên sau khi cập nhật, null nếu không tồn tại.
    /// </summary>
    Task<ChatSessionResponse?> SetSessionResolvedAsync(Guid sessionId, bool isResolved);

    /// <summary>
    /// [ADMIN] Xoá hẳn phiên chat kèm toàn bộ tin nhắn của phiên (dọn phiên rác/spam
    /// hoặc theo yêu cầu xoá dữ liệu của khách). Trả về phiên vừa xoá để tầng ngoài
    /// broadcast realtime, null nếu phiên không tồn tại.
    /// </summary>
    Task<ChatSessionResponse?> DeleteSessionAsync(Guid sessionId);

    /// <summary>
    /// Khách gửi tin nhắn qua REST (fallback khi SignalR lỗi).
    /// Yêu cầu token phiên hợp lệ; KHÔNG tự tạo phiên mới.
    /// </summary>
    Task<GuestChatMessageResponse> SendGuestMessageAsync(
        string sessionId, string? sessionToken, string content, string? guestName, string? guestPhone);
}
