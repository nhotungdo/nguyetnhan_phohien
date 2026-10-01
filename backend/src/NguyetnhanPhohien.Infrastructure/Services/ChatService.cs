using Microsoft.EntityFrameworkCore;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly AppDbContext _db;

    public ChatService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ChatSessionResponse> GetOrCreateSessionAsync(string sessionId, string? guestName, string? guestPhone)
    {
        var session = await _db.ChatSessions
            .FirstOrDefaultAsync(cs => cs.SessionId == sessionId);

        if (session == null)
        {
            session = new ChatSession
            {
                SessionId = sessionId,
                GuestName = guestName,
                GuestPhone = guestPhone
            };
            _db.ChatSessions.Add(session);
            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // SessionId có unique index: 2 request tạo cùng lúc (guest connect + REST
                // fallback gọi song song) thì request thua sẽ vào đây — lấy lại phiên
                // đã có của request thắng thay vì báo lỗi cho khách.
                _db.Entry(session).State = EntityState.Detached;
                session = await _db.ChatSessions.FirstAsync(cs => cs.SessionId == sessionId);
            }
        }
        else
        {
            // Cập nhật thông tin nếu khách cung cấp lần này
            if (!string.IsNullOrWhiteSpace(guestName)) session.GuestName = guestName;
            if (!string.IsNullOrWhiteSpace(guestPhone)) session.GuestPhone = guestPhone;
            await _db.SaveChangesAsync();
        }

        return MapSessionToResponse(session, string.Empty);
    }

    public async Task<ChatMessageResponse> SaveMessageAsync(Guid sessionId, string content, string senderType)
    {
        var session = await _db.ChatSessions.FindAsync(sessionId)
            ?? throw new KeyNotFoundException("Phiên chat không tồn tại.");

        var message = new ChatMessage
        {
            ChatSessionId = sessionId,
            Content = content,
            SenderType = senderType,
            IsRead = senderType == "Admin" // Admin gửi thì coi như đã đọc
        };

        _db.ChatMessages.Add(message);

        // Cập nhật session
        session.LastMessageAt = DateTime.UtcNow;
        if (senderType == "Guest")
            session.HasUnreadMessages = true;

        await _db.SaveChangesAsync();

        return new ChatMessageResponse
        {
            Id = message.Id,
            Content = message.Content,
            SenderType = message.SenderType,
            IsRead = message.IsRead,
            SentAt = message.SentAt
        };
    }

    public async Task<ChatMessageResponse> SendGuestMessageAsync(string sessionId, string content, string? guestName, string? guestPhone)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 100)
            throw new ArgumentException("SessionId không hợp lệ.");
        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
            throw new ArgumentException("Tin nhắn rỗng hoặc vượt quá 2000 ký tự.");

        var session = await GetOrCreateSessionAsync(sessionId, guestName, guestPhone);
        return await SaveMessageAsync(session.Id, content.Trim(), "Guest");
    }

    public async Task<IEnumerable<ChatSessionResponse>> GetAllSessionsAsync()
    {
        return await _db.ChatSessions
            .OrderByDescending(cs => cs.LastMessageAt)
            .Select(s => new ChatSessionResponse
            {
                Id = s.Id,
                SessionId = s.SessionId,
                GuestName = s.GuestName,
                GuestPhone = s.GuestPhone,
                HasUnreadMessages = s.HasUnreadMessages,
                IsResolved = s.IsResolved,
                LastMessageAt = s.LastMessageAt,
                LastMessagePreview = s.Messages.OrderByDescending(m => m.SentAt).Select(m => m.Content).FirstOrDefault() ?? string.Empty
            })
            .ToListAsync();
    }

    public async Task<IEnumerable<ChatMessageResponse>> GetSessionMessagesAsync(Guid sessionId)
    {
        var messages = await _db.ChatMessages
            .Where(m => m.ChatSessionId == sessionId)
            .OrderBy(m => m.SentAt)
            .ToListAsync();

        return messages.Select(m => new ChatMessageResponse
        {
            Id = m.Id,
            Content = m.Content,
            SenderType = m.SenderType,
            IsRead = m.IsRead,
            SentAt = m.SentAt
        });
    }

    public async Task MarkSessionReadAsync(Guid sessionId)
    {
        var session = await _db.ChatSessions
            .Include(cs => cs.Messages)
            .FirstOrDefaultAsync(cs => cs.Id == sessionId);

        if (session == null) return;

        session.HasUnreadMessages = false;
        foreach (var msg in session.Messages.Where(m => !m.IsRead))
            msg.IsRead = true;

        await _db.SaveChangesAsync();
    }

    private static ChatSessionResponse MapSessionToResponse(ChatSession session, string lastMessagePreview) => new()
    {
        Id = session.Id,
        SessionId = session.SessionId,
        GuestName = session.GuestName,
        GuestPhone = session.GuestPhone,
        HasUnreadMessages = session.HasUnreadMessages,
        IsResolved = session.IsResolved,
        LastMessageAt = session.LastMessageAt,
        LastMessagePreview = lastMessagePreview
    };
}
