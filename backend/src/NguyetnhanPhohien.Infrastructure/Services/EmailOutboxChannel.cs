using System.Threading.Channels;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class EmailOutboxChannel : IEmailOutboxChannel
{
    private readonly Channel<bool> _channel = Channel.CreateBounded<bool>(new BoundedChannelOptions(100)
    {
        FullMode = BoundedChannelFullMode.DropOldest
    });

    public void NotifyNewEmail()
    {
        _channel.Writer.TryWrite(true);
    }

    public ChannelReader<bool> Reader => _channel.Reader;
}
