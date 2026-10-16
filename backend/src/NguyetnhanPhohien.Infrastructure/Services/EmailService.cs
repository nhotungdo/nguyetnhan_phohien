using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class EmailService : IEmailService
{
    private const int MaxAttempts = 3;
    private static readonly TimeSpan[] RetryDelays = { TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5) };

    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlMessage, string? plainTextMessage = null)
    {
        var host = _config["SmtpConfig:Host"];
        var portStr = _config["SmtpConfig:Port"];
        var username = _config["SmtpConfig:Username"];
        var password = _config["SmtpConfig:Password"];

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            // Trước đây: ghi Console rồi im lặng BỎ email — giờ ném lỗi để caller log rõ ràng.
            _logger.LogError(
                "Không gửi được email tới {To}: SmtpConfig:Host/Username/Password chưa cấu hình (user-secrets hoặc biến môi trường).",
                to);
            throw new InvalidOperationException("SmtpConfig chưa cấu hình đầy đủ — không thể gửi email.");
        }

        int port = 587;
        if (!string.IsNullOrEmpty(portStr) && int.TryParse(portStr, out int p))
        {
            port = p;
        }

        var message = BuildMessage(to, subject, htmlMessage, plainTextMessage, username);

        // ===== RETRY 3 LẦN với backoff 2s → 5s: chống mất email do lỗi SMTP tạm thời =====
        for (int attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                using var client = new SmtpClient
                {
                    // Giới hạn 15s mỗi bước kết nối — tránh treo cả dịch vụ nền vì SMTP không phản hồi.
                    Timeout = 15_000
                };

                await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(username, password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                _logger.LogInformation("Đã gửi email tới {To} — \"{Subject}\".", to, subject);
                return;
            }
            catch (OperationCanceledException)
            {
                throw; // App đang tắt — không retry.
            }
            catch (Exception ex) when (attempt < MaxAttempts)
            {
                var delay = RetryDelays[Math.Min(attempt - 1, RetryDelays.Length - 1)];
                _logger.LogWarning(
                    ex,
                    "Gửi email tới {To} thất bại (lần {Attempt}/{MaxAttempts}): {ErrorMessage}. Thử lại sau {Delay}s...",
                    to, attempt, MaxAttempts, ex.Message, delay.TotalSeconds);
                await Task.Delay(delay);
            }
            catch (Exception ex)
            {
                // Hết lượt retry — ném lỗi kèm log ERROR rõ ràng để caller quyết định tiếp.
                _logger.LogError(
                    ex,
                    "Gửi email tới {To} THẤT BẠI SAU {MaxAttempts} LẦN — email có thể bị mất! Tiêu đề: \"{Subject}\".",
                    to, MaxAttempts, subject);
                throw;
            }
        }
    }

    private static MimeMessage BuildMessage(string to, string subject, string htmlMessage, string? plainTextMessage, string fromAddress)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Nguyệt Nhãn Phố Hiến", fromAddress));
        message.To.Add(MailboxAddress.Parse(to));
        message.ReplyTo.Add(new MailboxAddress("Nguyệt Nhãn Phố Hiến", fromAddress));
        message.Subject = subject;
        message.Date = DateTimeOffset.Now;
        var senderDomain = fromAddress.Contains('@') ? fromAddress.Split('@').Last() : "gmail.com";
        message.MessageId = MimeKit.Utils.MimeUtils.GenerateMessageId(senderDomain);

        // Các header chuẩn RFC dành cho email giao dịch hợp lệ (chống hiểu nhầm là spam/quảng cáo)
        message.Headers.Add("X-Mailer", "NguyetNhanPhoHien Order System");
        message.Headers.Add("X-Priority", "3");
        message.Headers.Add("X-Auto-Response-Suppress", "All");
        message.Headers.Add("Auto-Submitted", "auto-generated");

        var builder = new BodyBuilder
        {
            HtmlBody = htmlMessage,
            TextBody = !string.IsNullOrWhiteSpace(plainTextMessage) 
                ? plainTextMessage 
                : StripHtmlToPlainText(htmlMessage)
        };

        // Đính kèm logo inline qua CID nếu có tham chiếu cid:logo_nn trong HTML
        if (htmlMessage.Contains("cid:logo_nn", StringComparison.OrdinalIgnoreCase))
        {
            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "logo.jpg"),
                Path.Combine(AppContext.BaseDirectory, "wwwroot", "images", "logo.jpg"),
                Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "wwwroot", "images", "logo.jpg")),
                Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "NguyetnhanPhohien.API", "wwwroot", "images", "logo.jpg"))
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    var image = builder.LinkedResources.Add(path);
                    image.ContentId = "logo_nn";
                    image.ContentType.MediaType = "image";
                    image.ContentType.MediaSubtype = "jpeg";
                    break;
                }
            }
        }

        message.Body = builder.ToMessageBody();
        return message;
    }

    private static string StripHtmlToPlainText(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;

        var text = html
            .Replace("<br>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br/>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("<br />", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</tr>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</p>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</div>", "\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h1>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h2>", "\n\n", StringComparison.OrdinalIgnoreCase)
            .Replace("</h3>", "\n\n", StringComparison.OrdinalIgnoreCase);

        text = System.Text.RegularExpressions.Regex.Replace(text, "<[^>]+>", " ");
        text = System.Net.WebUtility.HtmlDecode(text);
        return System.Text.RegularExpressions.Regex.Replace(text, @"[ \t]+", " ").Trim();
    }
}
