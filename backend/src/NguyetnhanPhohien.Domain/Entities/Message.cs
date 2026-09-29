using System;
using NguyetnhanPhohien.Domain.Enums;
namespace NguyetnhanPhohien.Domain.Entities;
public class Message {
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public MessageSenderType SenderType { get; set; }
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
