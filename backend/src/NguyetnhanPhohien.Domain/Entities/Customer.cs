using System;
using System.Collections.Generic;
namespace NguyetnhanPhohien.Domain.Entities;
public class Customer {
    public Guid Id { get; set; }
    public string FacebookSenderId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ProfilePicUrl { get; set; }
    public ICollection<Conversation> Conversations { get; set; } = new List<Conversation>();
}
