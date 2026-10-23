using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.DTOs.Orders;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Application.Payment;
using NguyetnhanPhohien.Domain;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;
using Npgsql;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderService> _logger;
    private readonly string _frontendBaseUrl;
    private readonly string _adminNotifyEmail;
    private readonly IPaymentSettingsService _paymentSettings;

    public OrderService(
        AppDbContext db,
        IEmailService emailService,
        IPaymentSettingsService paymentSettings,
        ILogger<OrderService> logger,
        IConfiguration config)
    {
        _db = db;
        _emailService = emailService;
        _paymentSettings = paymentSettings;
        _logger = logger;
        // Domain frontend để gắn vào link trong email — hardcode "localhost:3000"
        _frontendBaseUrl = (config["Frontend:BaseUrl"] ?? "https://nguyetnhanphohien.com").TrimEnd('/');
        // Email nhận thông báo đơn mới — cấu hình qua Order:AdminNotifyEmail để đổi
        // người nhận không cần deploy lại.
        _adminNotifyEmail = config["Order:AdminNotifyEmail"] ?? "nguyetnhanphohien@gmail.com";
        // Thông tin nhận thanh toán (VietQR) KHÔNG đọc trực tiếp ở đây nữa: chủ shop
        // sửa trong trang quản trị /payment nên phải đọc từ DB qua IPaymentSettingsService
        // (appsettings Payment:* chỉ còn là giá trị mặc định — xem PaymentSettingsService).
    }

    public async Task<OrderResponse> CreateOrderAsync(CreateOrderRequest request)
    {
        // ===== 1. CHUẨN HÓA VÀ VALIDATE DANH SÁCH SẢN PHẨM =====
        var requestedItems = new List<(Guid ProductId, int Quantity)>();

        if (request.Items != null && request.Items.Count > 0)
        {
            foreach (var item in request.Items)
            {
                if (!Guid.TryParse(item.ProductId, out var pId))
                    throw new ArgumentException("ID sản phẩm không hợp lệ.");
                if (item.Quantity < 1 || item.Quantity > 999)
                    throw new ArgumentException("Số lượng phải từ 1 đến 999.");

                requestedItems.Add((pId, item.Quantity));
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.ProductId) && Guid.TryParse(request.ProductId, out var legacyId))
        {
            var qty = request.Quantity ?? 1;
            if (qty < 1 || qty > 999)
                throw new ArgumentException("Số lượng phải từ 1 đến 999.");

            requestedItems.Add((legacyId, qty));
        }

        if (requestedItems.Count == 0)
            throw new ArgumentException("Vui lòng chọn ít nhất 1 sản phẩm.");

        // Gom nhóm sản phẩm nếu client gửi trùng ProductId
        var groupedItems = requestedItems
            .GroupBy(i => i.ProductId)
            .Select(g => (ProductId: g.Key, Quantity: g.Sum(i => i.Quantity)))
            .ToList();

        var productIds = groupedItems.Select(g => g.ProductId).ToList();

        // Lấy thông tin sản phẩm từ DB (chỉ tin giá từ DB)
        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id) && p.IsActive)
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Count)
            throw new ArgumentException("Có sản phẩm không tồn tại hoặc đã ngừng bán.");

        // Tạo danh sách OrderItem và tính BaseAmount
        var orderItems = new List<OrderItem>();
        decimal baseAmount = 0;

        foreach (var item in groupedItems)
        {
            var product = products[item.ProductId];
            var totalPrice = product.Price * item.Quantity;
            baseAmount += totalPrice;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ProductSize = product.Size,
                UnitPrice = product.Price,
                Quantity = item.Quantity,
                TotalPrice = totalPrice
            });
        }

        // ===== 2. VALIDATE MÃ GIẢM GIÁ VÀ TÍNH SỐ TIỀN GIẢM =====
        decimal discountAmount = 0;
        DiscountCode? appliedDiscount = null;

        // SĐT đã chuẩn hóa (chỉ chữ số) — khóa chống dùng lại mã giảm giá.
        // "0912 345 678" và "0912345678" phải là CÙNG một khách.
        var normalizedPhone = PhoneNumber.Normalize(request.CustomerPhone);

        if (!string.IsNullOrWhiteSpace(request.DiscountCode))
        {
            // Không phân biệt hoa/thường — khách gõ "welcome10" vẫn khớp mã "WELCOME10"
            var code = request.DiscountCode.Trim().ToUpperInvariant();
            var discountCode = await _db.DiscountCodes
                .FirstOrDefaultAsync(d => d.Code.ToUpper() == code && d.IsActive && !d.IsAdminBackdoor)
                ?? throw new ArgumentException("Mã giảm giá không hợp lệ.");

            if (discountCode.ExpiresAt.HasValue && discountCode.ExpiresAt.Value < DateTime.UtcNow)
                throw new ArgumentException("Mã giảm giá đã hết hạn.");

            if (discountCode.MaxUsageCount.HasValue && discountCode.UsageCount >= discountCode.MaxUsageCount.Value)
                throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");

            if (discountCode.PercentOff.HasValue)
            {
                if (discountCode.PercentOff.Value <= 0 || discountCode.PercentOff.Value > 100)
                    throw new ArgumentException("Mã giảm giá không hợp lệ.");
                discountAmount = decimal.Round(baseAmount * discountCode.PercentOff.Value / 100m, 0, MidpointRounding.AwayFromZero);
            }
            else if (discountCode.AmountOff.HasValue)
            {
                if (discountCode.AmountOff.Value <= 0)
                    throw new ArgumentException("Mã giảm giá không hợp lệ.");
                discountAmount = Math.Min(discountCode.AmountOff.Value, baseAmount);
            }
            else
            {
                throw new ArgumentException("Mã giảm giá không hợp lệ.");
            }

            // ===== QUY TẮC: mỗi SĐT chỉ dùng một mã giảm giá ĐÚNG MỘT LẦN =====
            // Kiểm tra tường minh ở đây để trả thông báo rõ ràng; unique index
            // (DiscountCodeId, CustomerPhone) bên dưới là chốt chặn cho race condition.
            if (await _db.DiscountRedemptions.AnyAsync(r =>
                    r.DiscountCodeId == discountCode.Id && r.CustomerPhone == normalizedPhone))
                throw new ArgumentException("Số điện thoại này đã sử dụng mã giảm giá rồi.");

            appliedDiscount = discountCode;
        }

        // ===== 3. TẠO ĐƠN HÀNG =====
        var firstItem = orderItems.First();
        var order = new Order
        {
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            CustomerAddress = request.CustomerAddress,
            Note = request.Note,
            // Dynamic multi-items
            Items = orderItems,
            // Legacy single-item fallback (lấy món đầu tiên)
            ProductId = firstItem.ProductId,
            ProductName = firstItem.ProductName,
            ProductSize = firstItem.ProductSize,
            Quantity = firstItem.Quantity,

            BaseAmount = baseAmount,
            TotalAmount = Math.Max(0, baseAmount - discountAmount),
            DiscountAmount = discountAmount,
            DiscountCodeApplied = appliedDiscount?.Code,
            Status = OrderStatus.PendingConfirmation,
            CreatedAt = DateTime.UtcNow
        };

        // ===== 4. TĂNG LƯỢT DÙNG MÃ + LƯU ĐƠN TRONG MỘT TRANSACTION =====
        // ExecuteUpdateAsync ghi xuống DB ngay lập tức, tách khỏi transaction
        // riêng của SaveChangesAsync. Nếu lưu đơn thất bại sau khi đã tăng
        // UsageCount, lượt mã sẽ bị "đốt" oan cho một đơn không tồn tại.
        // Bọc cả hai trong một transaction: lỗi ở bước nào cũng rollback toàn bộ.
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            if (appliedDiscount != null)
            {
                // UPDATE có điều kiện (UsageCount < MaxUsageCount) giữ nguyên tính
                // nguyên tử chống race condition: nhiều request tranh chấp cùng lúc
                // thì chỉ một request thắng, những request kia nhận affected == 0.
                var affected = await _db.DiscountCodes
                    .Where(d => d.Id == appliedDiscount.Id
                        && (!d.MaxUsageCount.HasValue || d.UsageCount < d.MaxUsageCount.Value))
                    .ExecuteUpdateAsync(s => s.SetProperty(d => d.UsageCount, d => d.UsageCount + 1));

                if (affected == 0)
                    throw new ArgumentException("Mã giảm giá đã được sử dụng hết lượt.");
            }

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            if (appliedDiscount != null)
            {
                // Ghi dấu đã dùng mã cho SĐT này NGAY TRONG transaction. Nếu hai
                // request cùng SĐT + cùng mã chạy song song, một request sẽ vướng
                // unique index và bị chặn ở đây thay vì giảm giá lần thứ hai.
                _db.DiscountRedemptions.Add(new DiscountRedemption
                {
                    DiscountCodeId = appliedDiscount.Id,
                    Code = appliedDiscount.Code,
                    CustomerPhone = normalizedPhone,
                    OrderId = order.Id
                });

                try
                {
                    await _db.SaveChangesAsync();
                }
                catch (DbUpdateException ex) when (IsUniqueViolation(ex))
                {
                    throw new ArgumentException("Số điện thoại này đã sử dụng mã giảm giá rồi.", ex);
                }
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Dựng URL QR NGAY TẠI ĐÂY rồi truyền vào luồng gửi email chạy nền: SendOrderEmailsAsync
        // được gọi qua Task.Run SAU khi request kết thúc, nên nó không được tự đụng vào
        // service scoped/DbContext (đã dispose) — đọc cấu hình ở đây là an toàn nhất.
        var qrUrl = PaymentQr.Build(
            await _paymentSettings.GetAsync(), order.TotalAmount, TransferNote(order));

        // Gửi email bất đồng bộ (fire-and-forget): EmailService tự retry 3 lần với backoff;
        // nếu vẫn fail thì lỗi được ghi log ERROR kèm OrderId để tra cứu và gửi thủ công.
        _ = Task.Run(() => SendOrderEmailsAsync(order, qrUrl, adminNotify: true));

        return MapToResponse(order);
    }

    /// <summary>Nội dung chuyển khoản in kèm QR — dùng chung cho hóa đơn tạo mới và gửi lại.</summary>
    private static string TransferNote(Order order) =>
        $"Thanh toan don {order.Id.ToString().Substring(0, 8)}";

    private async Task SendOrderEmailsAsync(Order order, string qrUrl, bool adminNotify = true, bool throwOnFailure = false)
    {
        // Escape mọi dữ liệu người dùng nhập trước khi ghép vào HTML email:
        // tên/địa chỉ/ghi chú chứa thẻ HTML sẽ bị chèn thẳng vào mail admin
        // (HTML injection), trong khi báo cáo tuần đã escape đúng cách.
        static string Esc(string? s) => WebUtility.HtmlEncode(s ?? "");

        try
        {
            string adminEmail = _adminNotifyEmail;

            // Render HTML bảng danh sách các mặt hàng (Phong cách Premium Specialty)
            var itemsHtmlRows = string.Join("", order.Items.Select((item, idx) => $@"
                <tr>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: center;'>{idx + 1}</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028;'>
                        <strong style='font-weight: 600;'>{Esc(item.ProductName)}</strong>
                        {(string.IsNullOrWhiteSpace(item.ProductSize) ? "" : $"<br/><span style='font-size: 13px; color: #7B6858;'>Phân loại: {Esc(item.ProductSize)}</span>")}
                    </td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: right;'>{item.UnitPrice:N0}đ</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: center;'>{item.Quantity}</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #31572C; text-align: right; font-weight: 700;'>{item.TotalPrice:N0}đ</td>
                </tr>"));

            // URL QR VietQR (đã kèm số tiền + nội dung chuyển khoản) do caller truyền vào
            // — xem PaymentQr.Build: nơi duy nhất định nghĩa định dạng URL này.
            
            string invoiceHtml = $@"<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Xác nhận đơn hàng #{order.Id.ToString().Substring(0, 8).ToUpper()}</title>
</head>
<body style='margin: 0; padding: 0; background-color: #F7F2E8;'>
    <div style='background-color: #F7F2E8; padding: 40px 10px; font-family: ""Inter"", ""Segoe UI"", Tahoma, Geneva, sans-serif;'>
        <div style='max-width: 620px; margin: auto; background-color: #FFF9ED; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(61, 48, 40, 0.1); border: 1px solid #E2D5C4;'>
            
            <!-- Header & Logo -->
            <div style='background-color: #31572C; padding: 40px 30px; text-align: center; color: #FFF9ED; position: relative;'>
                <img src='cid:logo_nn' alt='Nguyệt Nhãn Phố Hiến' width='70' height='70' style='width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #E9B949; margin-bottom: 15px;' />
                <h1 style='margin: 0; font-size: 28px; font-family: ""Playfair Display"", ""Georgia"", serif; font-weight: 600; letter-spacing: 1px; color: #FFF9ED;'>Nguyệt Nhãn Phố Hiến</h1>
                <p style='margin: 8px 0 0 0; font-size: 15px; color: #E9B949; font-style: italic;'>Tinh hoa từ vùng đất Phố Hiến</p>
            </div>

            <!-- Body -->
            <div style='padding: 35px 40px;'>
                <h2 style='color: #31572C; font-size: 22px; font-family: ""Playfair Display"", ""Georgia"", serif; margin-top: 0; text-align: center; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;'>Hóa đơn đặt hàng</h2>
                <p style='text-align: center; color: #7B6858; font-size: 14px; margin-top: 0; margin-bottom: 30px;'>#{order.Id.ToString().Substring(0, 8).ToUpper()} &bull; {order.CreatedAt:dd/MM/yyyy}</p>
                
                <!-- Customer Info -->
                <div style='background-color: #FFFFFF; border: 1px solid #E2D5C4; padding: 20px; border-radius: 12px; margin-bottom: 30px;'>
                    <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Người nhận:</span> <strong>{Esc(order.CustomerName)}</strong></p>
                    <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Điện thoại:</span> <strong>{Esc(order.CustomerPhone)}</strong></p>
                    <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Địa chỉ:</span> <strong>{Esc(order.CustomerAddress)}</strong></p>
                    <p style='margin: 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Trạng thái:</span> <strong style='color: #31572C;'>Đã xác nhận</strong></p>
                </div>

                <!-- Products -->
                <h3 style='color: #3D3028; font-size: 16px; margin-top: 0; border-bottom: 2px solid #E2D5C4; padding-bottom: 10px;'>SẢN PHẨM</h3>
                <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                    <thead>
                        <tr style='color: #7B6858; font-size: 13px;'>
                            <th style='padding: 10px 8px; text-align: center; font-weight: 500; width: 5%;'>#</th>
                            <th style='padding: 10px 8px; text-align: left; font-weight: 500; width: 45%;'>Sản phẩm</th>
                            <th style='padding: 10px 8px; text-align: right; font-weight: 500; width: 20%;'>Đơn giá</th>
                            <th style='padding: 10px 8px; text-align: center; font-weight: 500; width: 10%;'>SL</th>
                            <th style='padding: 10px 8px; text-align: right; font-weight: 500; width: 20%;'>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtmlRows}
                    </tbody>
                </table>

                <!-- Total -->
                <div style='margin-top: 15px; padding-top: 15px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #7B6858;'>Tạm tính:</td>
                            <td style='padding: 6px; text-align: right; width: 130px; color: #3D3028; font-weight: 600;'>{order.BaseAmount:N0} đ</td>
                        </tr>
                        {(order.DiscountAmount > 0 ? $@"
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #E9B949;'>Giảm giá ({Esc(order.DiscountCodeApplied)}):</td>
                            <td style='padding: 6px; text-align: right; color: #E9B949; font-weight: 600;'>- {order.DiscountAmount:N0} đ</td>
                        </tr>" : "")}
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #7B6858;'>Phí vận chuyển:</td>
                            <td style='padding: 6px; text-align: right; width: 130px; color: #3D3028; font-weight: 600;'>Thỏa thuận</td>
                        </tr>
                        <tr>
                            <td colspan='2'><div style='border-top: 1px solid #E2D5C4; margin: 10px 0;'></div></td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 6px; text-align: right; font-size: 18px; font-weight: 700; color: #3D3028;'>TỔNG CỘNG:</td>
                            <td style='padding: 8px 6px; text-align: right; font-size: 20px; font-weight: 800; color: #31572C;'>{order.TotalAmount:N0} đ</td>
                        </tr>
                    </table>
                </div>

                <!-- QR Code Payment -->
                <div style='margin-top: 40px; text-align: center; border: 2px dashed #31572C; border-radius: 12px; padding: 25px; background-color: #FFFFFF;'>
                    <p style='color: #31572C; font-weight: 700; font-size: 16px; margin: 0 0 15px 0;'>[ QR THANH TOÁN ]</p>
                    <img src='{qrUrl}' alt='QR Code Thanh Toán' style='width: 250px; height: 250px; margin: 0 auto; display: block;' />
                    <p style='color: #7B6858; font-size: 14px; margin: 15px 0 0 0;'>Quét mã bằng ứng dụng ngân hàng để thanh toán tự động</p>
                </div>

                <!-- Thank you note -->
                <div style='margin-top: 40px; text-align: center;'>
                    <p style='color: #31572C; font-family: ""Playfair Display"", ""Georgia"", serif; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;'>🌿 Cảm ơn bạn đã lựa chọn đặc sản Hưng Yên</p>
                    <p style='color: #7B6858; font-size: 14px; line-height: 1.6; margin: 0; padding: 0 20px;'>Mỗi đơn hàng của bạn là một cách để những giá trị nông sản quê hương được tiếp tục gìn giữ và lan tỏa.</p>
                    
                    <!-- Second QR / Story link -->
                    <div style='margin-top: 25px;'>
                        <a href='{_frontendBaseUrl}' style='display: inline-block; background-color: #E9B949; color: #3D3028; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;'>Khám phá câu chuyện Long nhãn Hưng Yên</a>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style='background-color: #31572C; padding: 25px 20px; text-align: center;'>
                <p style='margin: 0 0 5px 0; color: #E9B949; font-weight: 700; font-size: 15px;'>Nguyệt Nhãn Phố Hiến - Đặc Sản Hưng Yên</p>
                <p style='margin: 0 0 6px 0; color: #FFF9ED; font-size: 13px; opacity: 0.9;'>Địa chỉ: Phường Hồng Châu, TP. Hưng Yên, Tỉnh Hưng Yên</p>
                <p style='margin: 0 0 12px 0; color: #FFF9ED; font-size: 13px; opacity: 0.9;'>Hotline / Zalo: <strong>034 897 3285</strong> &bull; Email: <strong>nguyetnhanphohien@gmail.com</strong></p>
                <div style='border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 10px; font-size: 11px; color: #FFF9ED; opacity: 0.7; line-height: 1.5;'>
                    <a href='{_frontendBaseUrl}' style='color: #E9B949; text-decoration: underline;'>Truy cập website</a> &bull; Đây là thư điện tử xác nhận giao dịch tự động. Quý khách vui lòng không trả lời thư này nếu không cần thiết.
                </div>
            </div>
        </div>
    </div>
</body>
</html>";

            // Tạo phiên bản văn bản thuần (Plain Text) cho email giao dịch hợp chuẩn RFC
            string plainTextInvoice = $@"KÍNH GỬI QUÝ KHÁCH {order.CustomerName.ToUpper()},

Cảm ơn bạn đã tin tưởng và đặt hàng tại NGUYỆT NHÃN PHỐ HIẾN!
Mã đơn hàng: #{order.Id.ToString().Substring(0, 8).ToUpper()}
Thời gian đặt: {order.CreatedAt:dd/MM/yyyy HH:mm}

========================================
THÔNG TIN NGƯỜI NHẬN
========================================
- Khách hàng: {order.CustomerName}
- Số điện thoại: {order.CustomerPhone}
- Địa chỉ nhận hàng: {order.CustomerAddress}
{(string.IsNullOrWhiteSpace(order.Note) ? "" : $"- Ghi chú: {order.Note}\n")}- Trạng thái: Đã xác nhận đơn

========================================
CHI TIẾT ĐƠN HÀNG
========================================
{string.Join("\n", order.Items.Select((item, idx) => $"{idx + 1}. {item.ProductName}{(string.IsNullOrWhiteSpace(item.ProductSize) ? "" : $" ({item.ProductSize})")}\n   Số lượng: {item.Quantity} | Đơn giá: {item.UnitPrice:N0}đ | Thành tiền: {item.TotalPrice:N0}đ"))}

----------------------------------------
Tạm tính: {order.BaseAmount:N0} đ
{(order.DiscountAmount > 0 ? $"Giảm giá ({order.DiscountCodeApplied}): -{order.DiscountAmount:N0} đ\n" : "")}Phí vận chuyển: Thỏa thuận khi giao hàng
TỔNG CỘNG THANH TOÁN: {order.TotalAmount:N0} đ
----------------------------------------

========================================
HƯỚNG DẪN THANH TOÁN CHUYỂN KHOẢN
========================================
- Ngân hàng: Vui lòng xem mã VietQR trong bản email định dạng đầy đủ.
- Số tiền: {order.TotalAmount:N0} đ
- Nội dung chuyển khoản: {TransferNote(order)}

========================================
LIÊN HỆ & HỖ TRỢ
========================================
Nguyệt Nhãn Phố Hiến - Tinh hoa đặc sản Hưng Yên
- Địa chỉ: Phường Hồng Châu, TP. Hưng Yên, Tỉnh Hưng Yên
- Hotline/Zalo: 034 897 3285
- Email hỗ trợ: nguyetnhanphohien@gmail.com
- Website: {_frontendBaseUrl}
";

            // Gửi cho khách và admin TÁCH RIÊNG: một bên fail không chặn bên còn lại.
            // EmailService đã tự retry 3 lần — tới đây vẫn fail thì log ERROR để gửi thủ công.
            if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                try
                {
                    await _emailService.SendEmailAsync(
                        order.CustomerEmail,
                        $"Xác nhận đơn hàng #{order.Id.ToString().Substring(0, 8).ToUpper()} - Nguyệt Nhãn Phố Hiến",
                        invoiceHtml,
                        plainTextInvoice);
                    _logger.LogInformation("Đã gửi email xác nhận đơn {OrderId} tới khách {Email}.", order.Id, order.CustomerEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "GỬI THẤT BẠI email xác nhận cho khách {Email} (đơn {OrderId}) sau 3 lần thử — email có thể bị mất, cần gửi thủ công!",
                        order.CustomerEmail, order.Id);

                    if (throwOnFailure) throw;
                }
            }

            // Send to Admin (chỉ khi tạo đơn mới, không gửi khi Admin gửi lại hóa đơn thủ công)
            if (adminNotify)
            {
                string adminHtml = $@"<!DOCTYPE html>
<html lang='vi'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Có đơn hàng mới #{order.Id.ToString().Substring(0, 8).ToUpper()}</title>
</head>
<body style='margin: 0; padding: 0; background-color: #F7F2E8;'>
    <div style='background-color: #F7F2E8; padding: 40px 10px; font-family: ""Inter"", ""Segoe UI"", Tahoma, Geneva, sans-serif;'>
        <div style='max-width: 620px; margin: auto; background-color: #FFF9ED; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(61, 48, 40, 0.1); border: 1px solid #E2D5C4;'>
            
            <!-- Header & Logo -->
            <div style='background-color: #31572C; padding: 35px 30px; text-align: center; color: #FFF9ED; position: relative;'>
                <img src='cid:logo_nn' alt='Nguyệt Nhãn Phố Hiến' width='70' height='70' style='width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #E9B949; margin-bottom: 15px;' />
                <h1 style='margin: 0; font-size: 26px; font-family: ""Playfair Display"", ""Georgia"", serif; font-weight: 600; letter-spacing: 1px; color: #FFF9ED;'>Nguyệt Nhãn Phố Hiến</h1>
                <p style='margin: 6px 0 0 0; font-size: 14px; color: #E9B949; font-style: italic; letter-spacing: 0.5px;'>Hệ thống Quản trị &bull; Thông báo đơn hàng mới</p>
            </div>

            <!-- Body -->
            <div style='padding: 35px 40px;'>
                <!-- Badge & Title -->
                <div style='text-align: center; margin-bottom: 25px;'>
                    <span style='display: inline-block; background-color: #E9B949; color: #3D3028; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 5px 14px; border-radius: 20px; margin-bottom: 10px;'>🔔 Đơn hàng mới nhận</span>
                    <h2 style='color: #31572C; font-size: 22px; font-family: ""Playfair Display"", ""Georgia"", serif; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1.5px;'>Khách hàng vừa đặt đơn</h2>
                    <p style='color: #7B6858; font-size: 14px; margin: 0;'>Mã đơn: <strong style='color: #31572C;'>#{order.Id.ToString().Substring(0, 8).ToUpper()}</strong> &bull; {order.CreatedAt:dd/MM/yyyy HH:mm}</p>
                </div>
                
                <!-- Customer Info Card -->
                <div style='background-color: #FFFFFF; border: 1px solid #E2D5C4; padding: 22px; border-radius: 12px; margin-bottom: 30px;'>
                    <h3 style='margin: 0 0 14px 0; color: #31572C; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #F0E6D8; padding-bottom: 8px;'>👤 THÔNG TIN KHÁCH HÀNG</h3>
                    <table style='width: 100%; border-collapse: collapse; font-size: 14px;'>
                        <tr>
                            <td style='padding: 6px 0; color: #7B6858; width: 110px;'>Khách hàng:</td>
                            <td style='padding: 6px 0; color: #3D3028;'><strong>{Esc(order.CustomerName)}</strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 6px 0; color: #7B6858;'>Số điện thoại:</td>
                            <td style='padding: 6px 0; color: #3D3028;'><strong><a href='tel:{Esc(order.CustomerPhone)}' style='color: #31572C; text-decoration: none;'>{Esc(order.CustomerPhone)}</a></strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 6px 0; color: #7B6858;'>Email:</td>
                            <td style='padding: 6px 0; color: #3D3028;'><strong>{(string.IsNullOrWhiteSpace(order.CustomerEmail) ? "Không có" : $"<a href='mailto:{Esc(order.CustomerEmail)}' style='color: #31572C; text-decoration: none;'>{Esc(order.CustomerEmail)}</a>")}</strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 6px 0; color: #7B6858;'>Địa chỉ nhận:</td>
                            <td style='padding: 6px 0; color: #3D3028;'><strong>{Esc(order.CustomerAddress)}</strong></td>
                        </tr>
                        <tr>
                            <td style='padding: 6px 0; color: #7B6858;'>Ghi chú:</td>
                            <td style='padding: 6px 0; color: #8C6A3E; font-style: italic;'>{Esc(string.IsNullOrWhiteSpace(order.Note) ? "Không có ghi chú" : order.Note)}</td>
                        </tr>
                    </table>
                </div>

                <!-- Products Table -->
                <h3 style='color: #3D3028; font-size: 15px; margin-top: 0; border-bottom: 2px solid #E2D5C4; padding-bottom: 10px;'>📦 DANH SÁCH MẶT HÀNG ({order.Items.Count} sản phẩm)</h3>
                <table style='width: 100%; border-collapse: collapse; margin-top: 10px;'>
                    <thead>
                        <tr style='color: #7B6858; font-size: 13px;'>
                            <th style='padding: 10px 8px; text-align: center; font-weight: 500; width: 5%;'>#</th>
                            <th style='padding: 10px 8px; text-align: left; font-weight: 500; width: 45%;'>Sản phẩm</th>
                            <th style='padding: 10px 8px; text-align: right; font-weight: 500; width: 20%;'>Đơn giá</th>
                            <th style='padding: 10px 8px; text-align: center; font-weight: 500; width: 10%;'>SL</th>
                            <th style='padding: 10px 8px; text-align: right; font-weight: 500; width: 20%;'>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsHtmlRows}
                    </tbody>
                </table>

                <!-- Total -->
                <div style='margin-top: 15px; padding-top: 15px;'>
                    <table style='width: 100%; border-collapse: collapse;'>
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #7B6858;'>Tạm tính:</td>
                            <td style='padding: 6px; text-align: right; width: 130px; color: #3D3028; font-weight: 600;'>{order.BaseAmount:N0} đ</td>
                        </tr>
                        {(order.DiscountAmount > 0 ? $@"
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #E9B949;'>Giảm giá ({Esc(order.DiscountCodeApplied)}):</td>
                            <td style='padding: 6px; text-align: right; color: #E9B949; font-weight: 600;'>- {order.DiscountAmount:N0} đ</td>
                        </tr>" : "")}
                        <tr>
                            <td style='padding: 6px; text-align: right; color: #7B6858;'>Phí vận chuyển:</td>
                            <td style='padding: 6px; text-align: right; width: 130px; color: #3D3028; font-weight: 600;'>Thỏa thuận</td>
                        </tr>
                        <tr>
                            <td colspan='2'><div style='border-top: 1px solid #E2D5C4; margin: 10px 0;'></div></td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 6px; text-align: right; font-size: 18px; font-weight: 700; color: #3D3028;'>TỔNG CỘNG:</td>
                            <td style='padding: 8px 6px; text-align: right; font-size: 20px; font-weight: 800; color: #31572C;'>{order.TotalAmount:N0} đ</td>
                        </tr>
                    </table>
                </div>

                <!-- Call to action button to Dashboard -->
                <div style='margin-top: 35px; text-align: center;'>
                    <a href='{_frontendBaseUrl}/orders' style='display: inline-block; background-color: #31572C; color: #FFF9ED; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 14px rgba(49, 87, 44, 0.3);'>
                        👉 Vào Dashboard để xem chi tiết
                    </a>
                    <p style='margin: 12px 0 0 0; font-size: 13px; color: #7B6858;'>
                        Đường dẫn trực tiếp: <a href='{_frontendBaseUrl}/orders' style='color: #31572C; font-weight: 600; text-decoration: underline;'>{_frontendBaseUrl}/orders</a>
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style='background-color: #31572C; padding: 25px 20px; text-align: center;'>
                <p style='margin: 0 0 5px 0; color: #E9B949; font-weight: 700; font-size: 15px;'>Nguyệt Nhãn Phố Hiến - Quản Trị Hệ Thống</p>
                <p style='margin: 0 0 6px 0; color: #FFF9ED; font-size: 13px; opacity: 0.9;'>Địa chỉ: Phường Hồng Châu, TP. Hưng Yên, Tỉnh Hưng Yên</p>
                <p style='margin: 0 0 12px 0; color: #FFF9ED; font-size: 13px; opacity: 0.9;'>Hotline / Zalo: <strong>034 897 3285</strong> &bull; Email: <strong>nguyetnhanphohien@gmail.com</strong></p>
                <div style='border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 10px; font-size: 11px; color: #FFF9ED; opacity: 0.7; line-height: 1.5;'>
                    <a href='{_frontendBaseUrl}' style='color: #E9B949; text-decoration: underline;'>Truy cập website</a> &bull; Email thông báo tự động từ nguyetnhanphohien.com
                </div>
            </div>
        </div>
    </div>
</body>
</html>";

                string adminPlainText = $@"THÔNG BÁO ĐƠN HÀNG MỚI TỪ WEBSITE NGUYỆT NHÃN PHỐ HIẾN
Mã đơn hàng: #{order.Id.ToString().Substring(0, 8).ToUpper()}
Thời gian đặt: {order.CreatedAt:dd/MM/yyyy HH:mm}

========================================
THÔNG TIN KHÁCH HÀNG
========================================
- Khách hàng: {order.CustomerName}
- Số điện thoại: {order.CustomerPhone}
- Email: {order.CustomerEmail ?? "Không có"}
- Địa chỉ nhận hàng: {order.CustomerAddress}
- Ghi chú: {order.Note ?? "Không có"}

========================================
SẢN PHẨM ĐẶT HÀNG ({order.Items.Count} mặt hàng)
========================================
{string.Join("\n", order.Items.Select((item, idx) => $"{idx + 1}. {item.ProductName}{(string.IsNullOrWhiteSpace(item.ProductSize) ? "" : $" ({item.ProductSize})")}\n   Số lượng: {item.Quantity} | Đơn giá: {item.UnitPrice:N0}đ | Thành tiền: {item.TotalPrice:N0}đ"))}

----------------------------------------
Tạm tính: {order.BaseAmount:N0} đ
{(order.DiscountAmount > 0 ? $"Giảm giá ({order.DiscountCodeApplied}): -{order.DiscountAmount:N0} đ\n" : "")}Phí vận chuyển: Thỏa thuận
TỔNG CỘNG: {order.TotalAmount:N0} đ
----------------------------------------

Xem chi tiết đơn hàng tại Dashboard:
{_frontendBaseUrl}/orders

Website: {_frontendBaseUrl}
Hotline: 034 897 3285
";

                try
                {
                    await _emailService.SendEmailAsync(
                        adminEmail,
                        $"Đơn hàng mới #{order.Id.ToString().Substring(0, 8).ToUpper()} từ {order.CustomerName}",
                        adminHtml,
                        adminPlainText);
                    _logger.LogInformation("Đã gửi email thông báo đơn {OrderId} tới admin {AdminEmail}.", order.Id, adminEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(
                        ex,
                        "GỬI THẤT BẠI email thông báo cho ADMIN (đơn {OrderId}) sau 3 lần thử — đơn này có thể chưa được chủ cửa hàng biết đến!",
                        order.Id);
                }
            }
        }
        // Lưới an toàn cuối cùng cho luồng fire-and-forget: không để lỗi trong Task.Run
        // bị nuốt im lặng. CHỈ áp dụng khi throwOnFailure = false — nếu không, catch này
        // sẽ nuốt luôn lỗi mà ResendInvoiceAsync cố tình ném ra và API lại trả 200
        // "đã gửi thành công" trong khi email thất bại.
        catch (Exception ex) when (!throwOnFailure)
        {
            _logger.LogError(ex, "Lỗi bất ngờ khi xử lý email cho đơn {OrderId}.", order.Id);
        }
    }

    public async Task<IEnumerable<OrderResponse>> GetAllOrdersAsync()
    {
        var orders = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToResponse);
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        return order == null ? null : MapToResponse(order);
    }

    public async Task<OrderResponse> UpdateOrderStatusAsync(Guid id, string status)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với Id: {id}");

        // Enum.TryParse KHÔNG kiểm tra giá trị có nằm trong danh sách hợp lệ:
        // "99" hay "5" đều parse "thành công" và ghi thẳng (OrderStatus)99 vào DB
        // → UI mất nhãn/màu trạng thái, báo cáo tuần không đếm được đơn đó.
        // Bắt buộc thêm Enum.IsDefined để chỉ nhận các trạng thái hợp lệ.
        if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus) || !Enum.IsDefined(newStatus))
            throw new ArgumentException($"Trạng thái không hợp lệ: {status}");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        // Đổi trạng thái và hoàn lượt mã giảm giá chạy trong MỘT transaction:
        // một bên lỗi là rollback cả cụm — không để lại "đơn đã huỷ nhưng lượt mã
        // vẫn bị tính, hay lượt được trả về nhưng đơn vẫn chờ xác nhận".
        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            // Điều kiện chốt ở cấp DB để chống cà cưỡi khi hai tab admin bấm gần như
            // cùng lúc:
            //   - Huỷ đơn (không hoàn lượt 2 lần): chỉ dòng đang != Cancelled mới được
            //     chuyển — request sau nhận affected == 0, không hoàn lượt lần nữa.
            //   - Mở lại đơn đã huỷ (không tính lượt 2 lần): chỉ dòng đang == Cancelled
            //     mới được chuyển — chỉ lần "thoát khỏi huỷ" đầu tiên đếm lại lượt.
            // Các chuyển trạng thái thông thường (không liên quan huỷ) update vô điều kiện.
            var query = _db.Orders.Where(o => o.Id == id);
            if (newStatus == OrderStatus.Cancelled)
                query = query.Where(o => o.Status != OrderStatus.Cancelled);
            else if (order.Status == OrderStatus.Cancelled)
                query = query.Where(o => o.Status == OrderStatus.Cancelled);

            var affected = await query.ExecuteUpdateAsync(s => s
                .SetProperty(o => o.Status, newStatus)
                .SetProperty(o => o.UpdatedAt, DateTime.UtcNow));

            if (affected > 0 && !string.IsNullOrEmpty(order.DiscountCodeApplied))
            {
                if (newStatus == OrderStatus.Cancelled)
                {
                    // Hoàn lượt dùng mã khi đơn CHUYỂN sang "Đã huỷ" (affected > 0 —
                    // tức là trạng thái trong DB thực sự đổi, không phải bấm huỷ lần
                    // thứ hai; đơn không có mã thì không có gì để hoàn).
                    await RefundDiscountUsageAsync(order);
                }
                else if (order.Status == OrderStatus.Cancelled)
                {
                    // Mở lại đơn đã huỷ: tính lại lượt dùng mã như TRƯỚC KHI hoàn —
                    // tăng UsageCount và ghi lại dòng DiscountRedemption.
                    await ReconsumeDiscountUsageAsync(order);
                }
            }

            await transaction.CommitAsync();
            return MapToResponse(order);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    /// <summary>
    /// Hoàn trả lượt dùng mã giảm giá của đơn bị huỷ: xoá dòng DiscountRedemption
    /// gắn với đơn này (SĐT khách được dùng lại mã) và giảm UsageCount — không cho
    /// rơi xuống dưới 0.
    ///
    /// Chỉ giảm lượt khi dòng redemption của đơn TỒN TẠI: sự tồn tại của nó chứng
    /// minh UsageCount ĐANG bao gồm đơn này (khớp với luồng ghi năm CreateOrderAsync),
    /// và chính thao tác xoá là chốt "hoàn đúng một lần" — hoàn lại lần nữa thì
    /// deleted == 0 nên không giảm thêm. Đơn cũ trước khi có bảng redemption
    /// (hiếm) sẽ không tự hoàn được, phải xử tay.
    /// </summary>
    private async Task RefundDiscountUsageAsync(Order order)
    {
        var codeId = await _db.DiscountRedemptions
            .AsNoTracking()
            .Where(r => r.OrderId == order.Id)
            .Select(r => (Guid?)r.DiscountCodeId)
            .FirstOrDefaultAsync();
        if (codeId == null) return;

        var deleted = await _db.DiscountRedemptions
            .Where(r => r.OrderId == order.Id)
            .ExecuteDeleteAsync();
        if (deleted == 0) return; // dòng đã bị tab khác xoá (hoàn rồi) → không giảm thêm

        // Mã đã bị admin xoá (không dòng nào khớp) thì không đổi gì — vẫn an toàn.
        await _db.DiscountCodes
            .Where(d => d.Id == codeId.Value && d.UsageCount > 0)
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.UsageCount, d => d.UsageCount - 1));
    }

    /// <summary>
    /// Mở lại (reopen) một đơn đã huỷ: khôi phục lượt dùng mã mà
    /// RefundDiscountUsageAsync đã hoàn trước đó — tăng UsageCount và ghi lại dòng
    /// DiscountRedemption, trả về bất biến "dòng redemption tồn tại ⇔ lượt đang
    /// được tính".
    ///
    /// Cả tăng lượt + ghi dòng chạy trong transaction của caller (UpdateOrderStatusAsync):
    /// một bên lỗi là rollback cả cụm, không để lại "lượt toang nhưng đơn vẫn huỷ".
    /// </summary>
    private async Task ReconsumeDiscountUsageAsync(Order order)
    {
        // Khá giống SĐT dùng làm khoá chống reuse khi tạo đơn — phải chuẩn hoá đúng
        // cách đó để dòng được bắt lại trùng khớp với dòng hoàn trước kia.
        var phone = PhoneNumber.Normalize(order.CustomerPhone);
        if (phone.Length == 0) return;

        var code = await _db.DiscountCodes
            .FirstOrDefaultAsync(d => d.Code == order.DiscountCodeApplied);
        if (code == null) return; // mã đã bị admin xoá — không còn gì để khôi phục

        // SĐT đã dùng lại mã này với một đơn khác trong lúc đơn cũ nằm trong "Đã huỷ"?
        // Dòng redemption DA TON TAI nghia la lượt đó thuộc về đơn khác — đơn mở lại
        // KHÔNG chiếm thêm lượt, giữ nguyên lượt của đơn kia.
        if (await _db.DiscountRedemptions.AnyAsync(r =>
                r.DiscountCodeId == code.Id && r.CustomerPhone == phone))
            return;

        // Đếm lượt TRƯỚC, giữ nguyên điều kiện khi tạo đơn (không vượt MaxUsageCount):
        // mã đã dùng hết lượt trong lúc đơn nằm "Đã huỷ" thì đơn mở lại xem như
        // không chiếm được lượt — dòng redemption cũng không ghi, khớp bất biến.
        var consumed = await _db.DiscountCodes
            .Where(d => d.Id == code.Id
                && (!d.MaxUsageCount.HasValue || d.UsageCount < d.MaxUsageCount.Value))
            .ExecuteUpdateAsync(s => s.SetProperty(d => d.UsageCount, d => d.UsageCount + 1));
        if (consumed == 0) return;

        _db.DiscountRedemptions.Add(new DiscountRedemption
        {
            DiscountCodeId = code.Id,
            Code = code.Code,
            CustomerPhone = phone,
            OrderId = order.Id
        });

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // Hai tab admin cùng mở lại đơn trong chớp mắt: unique index
            // (DiscountCodeId, CustomerPhone) chặn dòng trùng → ném lỗi rõ ràng,
            // transaction caller sẽ rollback cả tăng lượt + đổi trạng thái.
            throw new ArgumentException("Số điện thoại này đã sử dụng mã giảm giá rồi.", ex);
        }
    }

    /// <summary>
    /// [ADMIN] Gửi lại hóa đơn qua email cho khách hàng — dùng khi lần gửi tự động thất bại
    /// hoặc khách yêu cầu nhận lại hóa đơn.
    /// </summary>
    public async Task ResendInvoiceAsync(Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn hàng với Id: {id}");

        if (string.IsNullOrWhiteSpace(order.CustomerEmail))
            throw new InvalidOperationException("Đơn hàng này không có email khách hàng để gửi hóa đơn.");

        // Tái sử dụng toàn bộ logic render HTML hóa đơn,
        // Yêu cầu NÉM LỖI (throwOnFailure: true) nếu cấu hình email sai/lỗi mạng,
        // để API trả về mã lỗi 500 cho giao diện (hiện Toast đỏ thay vì báo gửi thành công ảo).
        var qrUrl = PaymentQr.Build(
            await _paymentSettings.GetAsync(), order.TotalAmount, TransferNote(order));

        await SendOrderEmailsAsync(order, qrUrl, adminNotify: false, throwOnFailure: true);

        _logger.LogInformation(
            "[Admin] Đã gửi lại hóa đơn đơn hàng {OrderId} tới khách {Email}.", id, order.CustomerEmail);
    }

    /// <summary>
    /// Có phải lỗi vi phạm ràng buộc duy nhất của Postgres (SQLSTATE 23505) không.
    /// Dùng để phân biệt "SĐT đã dùng mã" với các lỗi ghi DB khác.
    /// </summary>
    private static bool IsUniqueViolation(Exception? ex)
    {
        for (var e = ex; e != null; e = e.InnerException)
        {
            if (e is PostgresException { SqlState: "23505" }) return true;
        }
        return false;
    }

    private static OrderResponse MapToResponse(Order order)
    {
        var items = order.Items.Select(i => new OrderItemResponse
        {
            Id = i.Id,
            ProductId = i.ProductId,
            ProductName = i.ProductName,
            ProductSize = i.ProductSize,
            UnitPrice = i.UnitPrice,
            Quantity = i.Quantity,
            TotalPrice = i.TotalPrice
        }).ToList();

        var firstItem = items.FirstOrDefault();

        return new OrderResponse
        {
            Id = order.Id,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            CustomerEmail = order.CustomerEmail,
            CustomerAddress = order.CustomerAddress,
            Note = order.Note,
            BaseAmount = order.BaseAmount,
            TotalAmount = order.TotalAmount,
            DiscountAmount = order.DiscountAmount,
            DiscountCodeApplied = order.DiscountCodeApplied,
            Status = order.Status.ToString(),
            Items = items,
            // Fallback
            ProductName = firstItem?.ProductName ?? order.ProductName ?? string.Empty,
            ProductSize = firstItem?.ProductSize ?? order.ProductSize,
            Quantity = firstItem?.Quantity ?? order.Quantity,
            CreatedAt = order.CreatedAt
        };
    }
}
