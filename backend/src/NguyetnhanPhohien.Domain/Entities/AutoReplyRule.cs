using System;
namespace NguyetnhanPhohien.Domain.Entities;
public class AutoReplyRule {
    public Guid Id { get; set; }
    public Guid FacebookPageId { get; set; }
    public FacebookPage Page { get; set; } = null!;
    public string Keyword { get; set; } = string.Empty;
    public string ReplyText { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
