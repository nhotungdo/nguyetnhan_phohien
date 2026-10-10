namespace NguyetnhanPhohien.Application.Chat;

/// <summary>
/// Giới hạn dùng CHUNG cho phiên chat, để Hub, Controller và Service không lệch nhau.
///
/// Trước đây ChatHub cho sessionId dài tối đa 128 ký tự còn ChatController/ChatService
/// chỉ cho 100. Hai hằng số lệch nhau nghĩa là một id dài 101–128 gửi được qua
/// WebSocket nhưng bị 400 "SessionId không hợp lệ" khi rơi về REST fallback — lỗi
/// chỉ lộ ra khi mạng chặn WebSocket (đúng lúc khó chẩn đoán nhất).
/// </summary>
public static class ChatRules
{
    public const int SessionIdMaxLength = 128;
    public const int MaxMessageLength = 2000;
}
