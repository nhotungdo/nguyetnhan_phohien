using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.API.BackgroundJobs;

/// <summary>
/// Tiến trình nền (BackgroundService) xử lý hàng đợi EmailOutbox:
/// - Quét định kỳ (mỗi 5s) hoặc khi nhận tín hiệu từ IEmailOutboxChannel.
/// - Đảm bảo email lưu bền vững trong DB không bị mất khi restart / deploy / crash.
/// - Cơ chế retry lũy thừa (exponential backoff) tối đa 3 lần.
/// - Cập nhật trạng thái InvoiceEmailSentAt / InvoiceEmailError vào Order và broadcast SignalR.
/// </summary>
public class EmailOutboxProcessor : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmailOutboxChannel _channel;
    private readonly ILogger<EmailOutboxProcessor> _logger;

    public EmailOutboxProcessor(
        IServiceScopeFactory scopeFactory,
        IEmailOutboxChannel channel,
        ILogger<EmailOutboxProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _channel = channel;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("EmailOutboxProcessor background service bắt đầu chạy.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessOutboxBatchAsync(stoppingToken);

                // Chờ tín hiệu có email mới hoặc chờ tối đa 5 giây (polling chu kỳ)
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken, timeoutCts.Token);
                try
                {
                    if (await _channel.Reader.WaitToReadAsync(linkedCts.Token))
                    {
                        while (_channel.Reader.TryRead(out _)) { }
                    }
                }
                catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                {
                    // Hết chu kỳ 5s -> tiếp tục vòng lặp
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong vòng lặp EmailOutboxProcessor.");
                try
                {
                    await Task.Delay(5000, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        _logger.LogInformation("EmailOutboxProcessor background service đã dừng.");
    }

    private async Task ProcessOutboxBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
        var hubContext = scope.ServiceProvider.GetService<IHubContext<ProductsHub>>();

        bool ordersStatusChanged = false;

        for (var i = 0; i < 10; i++)
        {
            cancellationToken.ThrowIfCancellationRequested();
            await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
            var now = DateTime.UtcNow;
            // Keep the row locked until the SMTP outcome is saved. A stopped worker
            // releases the lock, so another worker can pick up the same row.
            var candidates = await db.EmailOutbox.FromSqlInterpolated($"""
                SELECT * FROM "EmailOutbox"
                WHERE "Status" IN ({(int)EmailOutboxStatus.Pending}, {(int)EmailOutboxStatus.Processing})
                   OR ("Status" = {(int)EmailOutboxStatus.Failed}
                       AND "RetryCount" < "MaxRetries"
                       AND ("NextRetryAt" IS NULL OR "NextRetryAt" <= {now}))
                ORDER BY "CreatedAt", "Id"
                LIMIT 1
                FOR UPDATE SKIP LOCKED
                """).ToListAsync(cancellationToken);
            var item = candidates.SingleOrDefault();
            if (item == null) break;

            try
            {
                await emailService.SendEmailAsync(
                    item.RecipientEmail,
                    item.Subject,
                    item.HtmlBody,
                    item.PlainTextBody);

                item.Status = EmailOutboxStatus.Sent;
                item.SentAt = DateTime.UtcNow;
                item.LastError = null;
                item.NextRetryAt = null;

                _logger.LogInformation(
                    "EmailOutbox gửi thành công [Id: {OutboxId}, Type: {Type}, To: {Recipient}, OrderId: {OrderId}]",
                    item.Id, item.EmailType, item.RecipientEmail, item.OrderId);
            }
            catch (Exception ex)
            {
                item.RetryCount++;
                item.LastError = ex.Message;

                _logger.LogWarning(
                    ex,
                    "EmailOutbox gửi thất bại lần {RetryCount}/{MaxRetries} [Id: {OutboxId}, Type: {Type}, To: {Recipient}, OrderId: {OrderId}]",
                    item.RetryCount, item.MaxRetries, item.Id, item.EmailType, item.RecipientEmail, item.OrderId);

                if (item.RetryCount < item.MaxRetries)
                {
                    // Lên lịch retry với exponential backoff (15s, 30s, 60s)
                    item.Status = EmailOutboxStatus.Failed;
                    item.NextRetryAt = DateTime.UtcNow.AddSeconds(Math.Pow(2, item.RetryCount) * 15);
                }
                else
                {
                    // Hết số lần retry -> Đánh dấu thất bại vĩnh viễn
                    item.Status = EmailOutboxStatus.Failed;
                    item.NextRetryAt = null;

                    _logger.LogError(
                        "EmailOutbox [Id: {OutboxId}, OrderId: {OrderId}] ĐÃ THẤT BẠI HOÀN TOÀN sau {MaxRetries} lần thử!",
                        item.Id, item.OrderId, item.MaxRetries);

                }
            }

            var sent = item.Status == EmailOutboxStatus.Sent;
            if ((sent || item.RetryCount >= item.MaxRetries)
                && item.OrderId.HasValue && item.EmailType == "OrderInvoice")
            {
                var order = await db.Orders.FindAsync(new object[] { item.OrderId.Value }, cancellationToken);
                if (order != null)
                {
                    if (sent) order.InvoiceEmailSentAt = item.SentAt;
                    order.InvoiceEmailError = item.LastError;
                    order.UpdatedAt = DateTime.UtcNow;
                    ordersStatusChanged = true;
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            db.ChangeTracker.Clear();
        }

        // Báo cho Admin Dashboard nếu có đơn hàng thay đổi trạng thái email
        if (ordersStatusChanged && hubContext != null)
        {
            try
            {
                await hubContext.Clients.Group(ProductsHub.AdminGroup).SendAsync(
                    ProductsHub.OrdersChangedEvent,
                    new { action = "email_status_updated", at = DateTime.UtcNow },
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không broadcast được sự kiện OrdersChanged sau khi cập nhật email status.");
            }
        }
    }
}
