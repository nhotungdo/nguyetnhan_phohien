using System;
namespace NguyetnhanPhohien.Domain.Entities;
public class BotSetting {
    public Guid Id { get; set; }
    public Guid FacebookPageId { get; set; }
    public FacebookPage Page { get; set; } = null!;
    public bool IsAiEnabled { get; set; }
    public string? AiPrompt { get; set; }
    public string? DefaultReply { get; set; }
}
