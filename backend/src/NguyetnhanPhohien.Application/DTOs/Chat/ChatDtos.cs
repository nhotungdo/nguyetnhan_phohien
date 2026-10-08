namespace NguyetnhanPhohien.Application.DTOs.Chat;

// Khách xin mở phiên chat mới (server cấp SessionId + token)
public class CreateSessionRequest
{
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
}

// Thông tin truy cập phiên chat cấp cho khách — token là chìa khoá duy nhất,
// không thể tự tính nếu không có secret nên không chiếm được phiên của người khác.
public class ChatSessionCredentialsResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string SessionToken { get; set; } = string.Empty;
}

// Khách gửi tin nhắn mới
public class SendMessageRequest
{
    public string SessionId { get; set; } = string.Empty;

    // Bắt buộc: token do POST /api/chat/session cấp
    public string? SessionToken { get; set; }

    public string Content { get; set; } = string.Empty;
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
}

// Admin gửi tin nhắn về cho khách
public class AdminReplyRequest
{
    public Guid ChatSessionId { get; set; }
    public string Content { get; set; } = string.Empty;
}

// DTO phiên chat trả về cho Admin
public class ChatSessionResponse
{
    public Guid Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }
    public bool HasUnreadMessages { get; set; }
    public bool IsResolved { get; set; }
    public DateTime LastMessageAt { get; set; }
    public string LastMessagePreview { get; set; } = string.Empty;
}

// Kết quả gửi tin nhắn của khách, kèm phiên chat chứa nó — để tầng ngoài
// (controller REST fallback) broadcast realtime cho Admin mà không cần query lại.
public class GuestChatMessageResponse
{
    public ChatSessionResponse Session { get; set; } = new();
    public ChatMessageResponse Message { get; set; } = new();
}

// DTO tin nhắn đơn lẻ
public class ChatMessageResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string SenderType { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}
