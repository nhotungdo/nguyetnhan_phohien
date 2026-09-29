using NguyetnhanPhohien.Application.DTOs.Chat;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IChatService
{
    Task<ChatSessionResponse> GetOrCreateSessionAsync(string sessionId, string? guestName, string? guestPhone);
    Task<ChatMessageResponse> SaveMessageAsync(Guid sessionId, string content, string senderType);
    Task<IEnumerable<ChatSessionResponse>> GetAllSessionsAsync();
    Task<IEnumerable<ChatMessageResponse>> GetSessionMessagesAsync(Guid sessionId);
    Task MarkSessionReadAsync(Guid sessionId);
}
