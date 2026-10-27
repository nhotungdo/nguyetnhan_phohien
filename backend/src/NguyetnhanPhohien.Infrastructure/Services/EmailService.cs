using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System.Text;
using System.Text.Json;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class EmailService : IEmailService
{
    private const int MaxAttempts = 3;
    private static readonly TimeSpan[] RetryDelays = { TimeSpan.FromSeconds(2), TimeSpan.FromSeconds(5) };

    /// <summary>
    /// Giới hạn thời gian cho MỘT lần gọi API gửi mail — khớp timeout 15s của SmtpClient.
    /// Không đặt thì HttpClient mặc định chờ tới 100s: một endpoint treo sẽ giữ
    /// task gửi mail (chạy nền) lây 100s mỗi lần thử × 3 lần retry.
    /// </summary>
    private static readonly TimeSpan HttpTimeout = TimeSpan.FromSeconds(15);

    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _httpClient;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHttpClientFactory? httpClientFactory = null)
    {
        _config = config;
        _logger = logger;
        _httpClient = httpClientFactory?.CreateClient() ?? new HttpClient();
        // Đặt TRƯỚC lần gửi đầu tiên (HttpClient.Timeout ném nếu đã gửi request rồi).
        _httpClient.Timeout = HttpTimeout;
    }

    /// <summary>
    /// Retry 3 lần với backoff 2s → 5s cho đường gửi qua HTTP API (Brevo/Resend).
    ///
    /// Trước đây chỉ SMTP có retry — còn Brevo/Resend gọi MỘT lần rồi bỏ cuộc, trong khi
    /// mọi caller (OrderService, WeeklyReport) lại ghi chú "EmailService đã tự retry 3 lần"
    /// → một lần 5xx / nảy mạng là email khách mất vĩnh viễn, chỉ còn dòng log ERROR.
    /// Đúng nghĩa "gửi ngay" là gửi NGAY nhưng vẫn không bỏ cuộc giữa chừng vì một lỗi tạm.
    ///
    /// Lưu ý: timeout của HttpClient ném TaskCanceledException (một OperationCanceledException).
    /// Chỉ rethrow khi CancellationToken do app yêu cầu thật sự — nếu rethrow tất cả OCE thì
    /// timeout bị coi là "app đang tắt" và không bao giờ được retry.
    /// </summary>
    private async Task SendWithRetryAsync(
        Func<Task> send,
        string provider,
        string to,
        string subject,
        CancellationToken cancellationToken = default)
    {
        for (int attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            try
            {
                await send();
                return;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw; // App đang tắt — không retry.
            }
            catch (Exception ex) when (attempt < MaxAttempts)
            {
                var delay = RetryDelays[Math.Min(attempt - 1, RetryDelays.Length - 1)];
                _logger.LogWarning(
                    ex,
                    "{Provider}: gửi email tới {To} thất bại (lần {Attempt}/{MaxAttempts}): {ErrorMessage}. Thử lại sau {Delay}s...",
                    provider, to, attempt, MaxAttempts, ex.Message, delay.TotalSeconds);
                await Task.Delay(delay, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "{Provider}: gửi email tới {To} THẤT BẠI SAU {MaxAttempts} LẦN — Tiêu đề: \"{Subject}\".",
                    provider, to, MaxAttempts, subject);
                throw;
            }
        }
    }

    public async Task SendEmailAsync(string to, string subject, string htmlMessage, string? plainTextMessage = null)
    {
        // 1. Kiểm tra nếu có API Key của Brevo (dịch vụ gửi mail qua HTTP POST cổng 443 — hoạt động hoàn hảo trên Render Free)
        var brevoApiKey = _config["Brevo:ApiKey"] ?? _config["BREVO_API_KEY"];
        if (!string.IsNullOrWhiteSpace(brevoApiKey))
        {
            await SendWithRetryAsync(
                () => SendViaBrevoApiAsync(to, subject, htmlMessage, plainTextMessage, brevoApiKey),
                "Brevo API", to, subject);
            return;
        }

        // 2. Kiểm tra nếu có API Key của Resend (cũng gửi qua HTTPS cổng 443)
        var resendApiKey = _config["Resend:ApiKey"] ?? _config["RESEND_API_KEY"];
        if (!string.IsNullOrWhiteSpace(resendApiKey))
        {
            await SendWithRetryAsync(
                () => SendViaResendApiAsync(to, subject, htmlMessage, plainTextMessage, resendApiKey),
                "Resend API", to, subject);
            return;
        }

        // 3. Fallback gửi qua SMTP thông thường (Gmail)
        var host = _config["SmtpConfig:Host"];
        var portStr = _config["SmtpConfig:Port"];
        var username = _config["SmtpConfig:Username"];
        var password = _config["SmtpConfig:Password"];

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            _logger.LogError(
                "Không gửi được email tới {To}: SmtpConfig:Host/Username/Password chưa cấu hình đầy đủ. " +
                "Nếu đang deploy trên Render, bạn cần cấu hình biến môi trường SmtpConfig__Password trong mục Environment của Render Dashboard.",
                to);
            throw new InvalidOperationException("SmtpConfig chưa cấu hình đầy đủ (thiếu SmtpConfig__Password) — không thể gửi email.");
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
                    "Gửi email tới {To} THẤT BẠI SAU {MaxAttempts} LẦN — Tiêu đề: \"{Subject}\".\n" +
                    "LƯU Ý QUAN TRỌNG: Nếu backend đang chạy trên gói Render Free, Render chặn các cổng SMTP 587/465. " +
                    "Để khắc phục, bạn có thể tạo tài khoản Brevo.com miễn phí (gửi 300 mail/ngày) " +
                    "rồi cấu hình biến môi trường Brevo__ApiKey trong mục Environment của Render Web Service.",
                    to, MaxAttempts, subject);
                throw;
            }
        }
    }

    private async Task SendViaBrevoApiAsync(string to, string subject, string htmlMessage, string? plainTextMessage, string apiKey)
    {
        var senderEmail = _config["SmtpConfig:Username"];
        if (string.IsNullOrWhiteSpace(senderEmail)) senderEmail = "nguyetnhanphohien@gmail.com";

        // Thay thế cid:logo_nn bằng URL tuyệt đối để logo hiển thị đẹp trên mọi ứng dụng email
        var frontendUrl = (_config["Frontend:BaseUrl"] ?? "https://nguyetnhanphohien.com").TrimEnd('/');
        var processedHtml = htmlMessage.Replace("cid:logo_nn", $"{frontendUrl}/logo.jpg", StringComparison.OrdinalIgnoreCase);

        var payload = new
        {
            sender = new { name = "Nguyệt Nhãn Phố Hiến", email = senderEmail },
            to = new[] { new { email = to } },
            replyTo = new { name = "Nguyệt Nhãn Phố Hiến", email = senderEmail },
            subject,
            htmlContent = processedHtml,
            textContent = !string.IsNullOrWhiteSpace(plainTextMessage) ? plainTextMessage : StripHtmlToPlainText(htmlMessage)
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Add("api-key", apiKey);
        request.Headers.Add("accept", "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gửi email qua Brevo API thất bại: {StatusCode} - {Error}", response.StatusCode, err);
            throw new InvalidOperationException($"Brevo API error: {response.StatusCode} - {err}");
        }

        _logger.LogInformation("Đã gửi email tới {To} thành công qua Brevo API (cổng 443 HTTPS).", to);
    }

    private async Task SendViaResendApiAsync(string to, string subject, string htmlMessage, string? plainTextMessage, string apiKey)
    {
        var senderEmail = _config["Resend:FromEmail"] ?? "onboarding@resend.dev";

        var payload = new
        {
            from = $"Nguyệt Nhãn Phố Hiến <{senderEmail}>",
            to = new[] { to },
            subject,
            html = htmlMessage,
            text = !string.IsNullOrWhiteSpace(plainTextMessage) ? plainTextMessage : StripHtmlToPlainText(htmlMessage)
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            _logger.LogError("Gửi email qua Resend API thất bại: {StatusCode} - {Error}", response.StatusCode, err);
            throw new InvalidOperationException($"Resend API error: {response.StatusCode} - {err}");
        }

        _logger.LogInformation("Đã gửi email tới {To} thành công qua Resend API (cổng 443 HTTPS).", to);
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
