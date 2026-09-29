using System;

namespace NguyetnhanPhohien.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ChatSessionId { get; set; }
    public ChatSession ChatSession { get; set; } = null!;

    public string Content { get; set; } = string.Empty;

    // "Guest" hoặc "Admin"
    public string SenderType { get; set; } = "Guest";

    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
