using System.Threading.Tasks;

namespace NguyetnhanPhohien.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlMessage);
}
