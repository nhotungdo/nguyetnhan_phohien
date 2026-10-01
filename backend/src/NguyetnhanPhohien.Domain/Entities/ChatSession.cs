using System;
using System.Collections.Generic;

namespace NguyetnhanPhohien.Domain.Entities;

/// <summary>
/// Khách hàng tương tác qua Live Chat (không cần tài khoản).
/// Được nhận diện qua SessionId (cookie/localStorage của browser).
/// </summary>
public class ChatSession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ID phiên vô danh của khách - lưu ở sessionStorage phía client.
    // Có unique index để tránh race tạo 2 phiên cùng lúc (xem AppDbContext).
    public string SessionId { get; set; } = string.Empty;

    // Tên khách tự khai khi bắt đầu chat (optional)
    public string? GuestName { get; set; }
    public string? GuestPhone { get; set; }

    public bool IsResolved { get; set; } = false;
    public bool HasUnreadMessages { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
