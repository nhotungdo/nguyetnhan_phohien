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
            // Chưa đọc: tin của Admin chờ khách xác nhận đã xem, tin của Guest chờ Admin mở phiên
            IsRead = false
        };

        _db.ChatMessages.Add(message);

        // Cập nhật session
        session.LastMessageAt = DateTime.UtcNow;
        if (senderType == "Guest")
            session.HasUnreadMessages = true;

        // Tin nhắn mới = phiên đang hoạt động lại → tự mở phiên đã phân giải
        // (khách quay lại hỏi sau khi admin đã đóng, hoặc admin gửi thêm sau khi đóng)
        if (session.IsResolved)
            session.IsResolved = false;

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

    public async Task<GuestChatMessageResponse> SendGuestMessageAsync(string sessionId, string content, string? guestName, string? guestPhone)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > 100)
            throw new ArgumentException("SessionId không hợp lệ.");
        if (string.IsNullOrWhiteSpace(content) || content.Length > 2000)
            throw new ArgumentException("Tin nhắn rỗng hoặc vượt quá 2000 ký tự.");

        var session = await GetOrCreateSessionAsync(sessionId, guestName, guestPhone);
        var message = await SaveMessageAsync(session.Id, content.Trim(), "Guest");

        return new GuestChatMessageResponse { Session = session, Message = message };
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
        // Admin mở phiên => chỉ tin của KHÁCH được xem là đã đọc.
        // Tin của Admin do chính khách xác nhận đọc (MarkMessagesReadByGuestAsync).
        foreach (var msg in session.Messages.Where(m => m.SenderType == "Guest" && !m.IsRead))
            msg.IsRead = true;

        await _db.SaveChangesAsync();
    }

    public async Task<Guid?> MarkMessagesReadByGuestAsync(string sessionId)
    {
        if (string.IsNullOrWhiteSpace(sessionId)) return null;

        var session = await _db.ChatSessions
            .Include(cs => cs.Messages)
            .FirstOrDefaultAsync(cs => cs.SessionId == sessionId);

        if (session == null) return null;

        var unreadAdminMessages = session.Messages.Where(m => m.SenderType == "Admin" && !m.IsRead).ToList();
        if (unreadAdminMessages.Count > 0)
        {
            foreach (var msg in unreadAdminMessages) msg.IsRead = true;
            await _db.SaveChangesAsync();
        }

        return session.Id;
    }

    public async Task<ChatSessionResponse?> SetSessionResolvedAsync(Guid sessionId, bool isResolved)
    {
        var session = await _db.ChatSessions
            .FirstOrDefaultAsync(cs => cs.Id == sessionId);

        if (session == null) return null;

        session.IsResolved = isResolved;
        if (isResolved)
        {
            // Đóng phiên = coi như admin đã xử lý xong → không còn báo chưa đọc
            session.HasUnreadMessages = false;
        }

        await _db.SaveChangesAsync();

        var lastMessage = await _db.ChatMessages
            .Where(m => m.ChatSessionId == sessionId)
            .OrderByDescending(m => m.SentAt)
            .Select(m => m.Content)
            .FirstOrDefaultAsync();

        return new ChatSessionResponse
        {
            Id = session.Id,
            SessionId = session.SessionId,
            GuestName = session.GuestName,
            GuestPhone = session.GuestPhone,
            HasUnreadMessages = session.HasUnreadMessages,
            IsResolved = session.IsResolved,
            LastMessageAt = session.LastMessageAt,
            LastMessagePreview = lastMessage ?? string.Empty
        };
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
