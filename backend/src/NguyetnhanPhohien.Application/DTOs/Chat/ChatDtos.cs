namespace NguyetnhanPhohien.Application.DTOs.Chat;

// Khách gửi tin nhắn mới
public class SendMessageRequest
{
    public string SessionId { get; set; } = string.Empty;
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

// DTO tin nhắn đơn lẻ
public class ChatMessageResponse
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string SenderType { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime SentAt { get; set; }
}
