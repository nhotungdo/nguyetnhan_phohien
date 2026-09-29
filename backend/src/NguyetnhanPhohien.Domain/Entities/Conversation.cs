using System;
using System.Collections.Generic;
using NguyetnhanPhohien.Domain.Enums;
namespace NguyetnhanPhohien.Domain.Entities;
public class Conversation {
    public Guid Id { get; set; }
    public Guid FacebookPageId { get; set; }
    public FacebookPage Page { get; set; } = null!;
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public ConversationStatus Status { get; set; } = ConversationStatus.Open;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
