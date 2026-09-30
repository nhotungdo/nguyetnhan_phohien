using Microsoft.Extensions.Configuration;
using NguyetnhanPhohien.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Threading.Tasks;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlMessage)
    {
        var host = _config["SmtpConfig:Host"];
        var portStr = _config["SmtpConfig:Port"];
        var username = _config["SmtpConfig:Username"];
        var password = _config["SmtpConfig:Password"];

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            // Nếu chưa cấu hình SMTP thì bỏ qua (hoặc log cảnh báo)
            Console.WriteLine("[EMAIL ERROR] SmtpConfig is missing or incomplete in appsettings.json. Cannot send email.");
            return;
        }

        int port = 587;
        if (!string.IsNullOrEmpty(portStr) && int.TryParse(portStr, out int p))
        {
            port = p;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Nguyệt Nhãn Phố Hiến", username));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;

        var builder = new BodyBuilder
        {
            HtmlBody = htmlMessage
        };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
