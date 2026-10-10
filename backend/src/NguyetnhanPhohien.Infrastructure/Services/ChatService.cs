using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NguyetnhanPhohien.Application.Chat;
using NguyetnhanPhohien.Application.DTOs.Chat;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class ChatService : IChatService
{
    private const string SessionSecretConfigKey = "Chat:SessionSecret";

    private readonly AppDbContext _db;
    private readonly string _sessionSecret;

    public ChatService(AppDbContext db, IConfiguration config)
    {
        _db = db;

        // Secret dùng để ký token phiên chat của khách. Mặc định lấy Jwt:Key vì
        // Program.cs đã chặn app khởi động khi Jwt:Key rỗng — muốn tách secret riêng
        // thì đặt Chat:SessionSecret.
        _sessionSecret = config[SessionSecretConfigKey] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(_sessionSecret))
            _sessionSecret = config["Jwt:Key"] ?? string.Empty;
        if (string.IsNullOrWhiteSpace(_sessionSecret))
            throw new InvalidOperationException(
                "Chat:SessionSecret (hoặc Jwt:Key) chưa được cấu hình — không ký được token phiên chat.");
    }

    // ===== PHIÊN CHAT CỦA KHÁCH =====
    //
    // SessionId do SERVER sinh, kèm một token = HMAC(sessionId). Trước đây client tự
    // sinh sessionId rồi dùng chính chuỗi đó làm chìa khoá để join group SignalR và
    // gọi REST → ai biết/đoán được id của người khác là đọc được tin nhắn Admin trả
    // lời cho người đó (IDOR), thậm chí gửi tin giả danh họ. Token là thứ duy nhất
    // chứng minh "kết nối này là chủ phiên", và không thể tự tính nếu không có secret.

    /// <summary>Tạo phiên chat mới cho khách + trả về token truy cập phiên đó.</summary>
    public async Task<ChatSessionCredentialsResponse> CreateGuestSessionAsync(string? guestName, string? guestPhone)
    {
        var session = new ChatSession
        {
            // 128 bit ngẫu nhiên — không đoán được (khác "guest-<timestamp>-<Math.random>" trước đây)
            SessionId = $"guest-{Guid.NewGuid():N}",
            GuestName = Truncate(guestName, 200),
            GuestPhone = Truncate(guestPhone, 50)
        };

        _db.ChatSessions.Add(session);
        await _db.SaveChangesAsync();

        return new ChatSessionCredentialsResponse
        {
            SessionId = session.SessionId,
            SessionToken = BuildSessionToken(session.SessionId)
        };
    }

    /// <summary>
    /// Tìm phiên theo SessionId (CHỈ ĐỌC — không tạo mới), cập nhật tên/SĐT nếu khách
    /// vừa cung cấp. Trả về null nếu phiên không tồn tại.
    /// </summary>
    public async Task<ChatSessionResponse?> FindSessionAsync(string sessionId, string? guestName = null, string? guestPhone = null)
    {
        var session = await _db.ChatSessions
            .FirstOrDefaultAsync(cs => cs.SessionId == sessionId);

        if (session == null) return null;

        var changed = false;
        var newName = Truncate(guestName, 200);
        var newPhone = Truncate(guestPhone, 50);
        if (!string.IsNullOrWhiteSpace(newName) && newName != session.GuestName)
        {
            session.GuestName = newName;
            changed = true;
        }
        if (!string.IsNullOrWhiteSpace(newPhone) && newPhone != session.GuestPhone)
        {
            session.GuestPhone = newPhone;
            changed = true;
        }
        if (changed) await _db.SaveChangesAsync();

        return MapSessionToResponse(session, string.Empty);
    }

    /// <summary>Token của khách có đúng là token của phiên này không (so sánh constant-time).</summary>
    public bool IsSessionTokenValid(string sessionId, string? sessionToken)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(sessionToken))
            return false;

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(BuildSessionToken(sessionId)),
            Encoding.UTF8.GetBytes(sessionToken));
    }

    private string BuildSessionToken(string sessionId)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_sessionSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes($"chat-session:{sessionId}"));
        return Convert.ToBase64String(hash).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string? Truncate(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return value;
        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
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

    public async Task<GuestChatMessageResponse> SendGuestMessageAsync(
        string sessionId, string? sessionToken, string content, string? guestName, string? guestPhone)
    {
        if (string.IsNullOrWhiteSpace(sessionId) || sessionId.Length > ChatRules.SessionIdMaxLength)
            throw new ArgumentException("SessionId không hợp lệ.");
        if (!IsSessionTokenValid(sessionId, sessionToken))
            throw new UnauthorizedAccessException("Phiên chat không hợp lệ hoặc đã hết hiệu lực.");
        if (string.IsNullOrWhiteSpace(content) || content.Length > ChatRules.MaxMessageLength)
            throw new ArgumentException($"Tin nhắn rỗng hoặc vượt quá {ChatRules.MaxMessageLength} ký tự.");

        // Không tạo phiên mới ở đây: phiên phải do CreateGuestSessionAsync cấp trước đó.
        var session = await FindSessionAsync(sessionId, guestName, guestPhone)
            ?? throw new KeyNotFoundException("Phiên chat không tồn tại.");

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

    public async Task<ChatSessionResponse?> DeleteSessionAsync(Guid sessionId)
    {
        var session = await _db.ChatSessions.FirstOrDefaultAsync(cs => cs.Id == sessionId);
        if (session == null) return null;

        // Xoá tin nhắn trước rồi mới xoá phiên. DB đã có ON DELETE CASCADE, nhưng xoá
        // tường minh để không phụ thuộc vào việc EF có nạp kèm collection Messages hay không.
        await _db.ChatMessages
            .Where(m => m.ChatSessionId == sessionId)
            .ExecuteDeleteAsync();

        _db.ChatSessions.Remove(session);
        await _db.SaveChangesAsync();

        // Đối tượng vẫn giữ giá trị trong bộ nhớ nên map được để báo realtime.
        return MapSessionToResponse(session, string.Empty);
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
