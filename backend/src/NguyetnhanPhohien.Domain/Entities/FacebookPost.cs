using System;
using NguyetnhanPhohien.Domain.Enums;
namespace NguyetnhanPhohien.Domain.Entities;
public class FacebookPost {
    public Guid Id { get; set; }
    public Guid FacebookPageId { get; set; }
    public FacebookPage Page { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public string? MediaUrl { get; set; }
    public PostStatus Status { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
