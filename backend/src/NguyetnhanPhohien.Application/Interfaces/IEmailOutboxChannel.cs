using System.Threading.Channels;

namespace NguyetnhanPhohien.Application.Interfaces;

/// <summary>
/// Kênh thông báo in-memory để đánh thức EmailOutboxProcessor ngay lập tức
/// khi có bản ghi email mới được ghi vào bảng EmailOutbox (không cần đợi hết chu kỳ polling).
/// </summary>
public interface IEmailOutboxChannel
{
    void NotifyNewEmail();
    ChannelReader<bool> Reader { get; }
}
