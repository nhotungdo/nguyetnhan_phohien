using System;
using System.Collections.Generic;
namespace NguyetnhanPhohien.Domain.Entities;
public class FacebookPage {
    public Guid Id { get; set; }
    public string PageId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string AccessToken { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public ICollection<FacebookPost> Posts { get; set; } = new List<FacebookPost>();
    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
}
