using System.Threading.Tasks;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }
    Task SendEmailAsync(string to, string subject, string htmlMessage, string? plainTextMessage = null);
}
