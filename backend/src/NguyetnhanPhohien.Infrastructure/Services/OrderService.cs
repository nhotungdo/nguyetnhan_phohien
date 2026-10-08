using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using NguyetnhanPhohien.Application.DTOs.Orders;
using NguyetnhanPhohien.Application.Interfaces;
using NguyetnhanPhohien.Domain.Entities;
using NguyetnhanPhohien.Domain.Enums;
using NguyetnhanPhohien.Infrastructure.Persistence;

namespace NguyetnhanPhohien.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly ILogger<OrderService> _logger;
    private readonly string _frontendBaseUrl;

    public OrderService(AppDbContext db, IEmailService emailService, ILogger<OrderService> logger, IConfiguration config)
    {
        _db = db;
        _emailService = emailService;
        _logger = logger;
        // Domain frontend để gắn vào link trong email — hardcode "localhost:3000"
        // trước đây tạo link chết khi deploy. Cấu hình qua Frontend:BaseUrl.
        _frontendBaseUrl = (config["Frontend:BaseUrl"] ?? "http://localhost:3000").TrimEnd('/');
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

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }

        // Gửi email bất đồng bộ (fire-and-forget): EmailService tự retry 3 lần với backoff;
        // nếu vẫn fail thì lỗi được ghi log ERROR kèm OrderId để tra cứu và gửi thủ công.
        _ = Task.Run(() => SendOrderEmailsAsync(order, adminNotify: true));

        return MapToResponse(order);
    }

    private async Task SendOrderEmailsAsync(Order order, bool adminNotify = true, bool throwOnFailure = false)
    {
        try
        {
            string adminEmail = "nhotungdo89@gmail.com";

            // Render HTML bảng danh sách các mặt hàng (Phong cách Premium Specialty)
            var itemsHtmlRows = string.Join("", order.Items.Select((item, idx) => $@"
                <tr>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: center;'>{idx + 1}</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028;'>
                        <strong style='font-weight: 600;'>{item.ProductName}</strong>
                        {(string.IsNullOrWhiteSpace(item.ProductSize) ? "" : $"<br/><span style='font-size: 13px; color: #7B6858;'>Phân loại: {item.ProductSize}</span>")}
                    </td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: right;'>{item.UnitPrice:N0}đ</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #3D3028; text-align: center;'>{item.Quantity}</td>
                    <td style='padding: 12px 8px; border-bottom: 1px dashed #E2D5C4; color: #31572C; text-align: right; font-weight: 700;'>{item.TotalPrice:N0}đ</td>
                </tr>"));

            // Mã QR thanh toán VietQR động. (Tạm dùng mẫu MBBank, anh sẽ cập nhật Tên TK / Số TK sau)
            string qrUrl = $"https://img.vietqr.io/image/MB-0901234567-compact2.png?amount={order.TotalAmount}&addInfo=Thanh toan don {order.Id.ToString().Substring(0,8)}&accountName=NGUYET NHAN PHO HIEN";
            
            string invoiceHtml = $@"
                <div style='background-color: #F7F2E8; padding: 40px 10px; font-family: ""Inter"", ""Segoe UI"", Tahoma, Geneva, sans-serif;'>
                    <div style='max-width: 620px; margin: auto; background-color: #FFF9ED; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(61, 48, 40, 0.1); border: 1px solid #E2D5C4;'>
                        
                        <!-- Header & Logo -->
                        <div style='background-color: #31572C; padding: 40px 30px; text-align: center; color: #FFF9ED; position: relative;'>
                            <img src='https://files.catbox.moe/wyfzaf.jpg' alt='Nguyệt Nhãn Phố Hiến' style='width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #E9B949; margin-bottom: 15px;' />
                            <h1 style='margin: 0; font-size: 28px; font-family: ""Playfair Display"", ""Georgia"", serif; font-weight: 600; letter-spacing: 1px; color: #FFF9ED;'>Nguyệt Nhãn Phố Hiến</h1>
                            <p style='margin: 8px 0 0 0; font-size: 15px; color: #E9B949; font-style: italic;'>Tinh hoa từ vùng đất Phố Hiến</p>
                        </div>

                        <!-- Body -->
                        <div style='padding: 35px 40px;'>
                            <h2 style='color: #31572C; font-size: 22px; font-family: ""Playfair Display"", ""Georgia"", serif; margin-top: 0; text-align: center; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px;'>Hóa đơn đặt hàng</h2>
                            <p style='text-align: center; color: #7B6858; font-size: 14px; margin-top: 0; margin-bottom: 30px;'>#{order.Id.ToString().Substring(0, 8).ToUpper()} &bull; {order.CreatedAt:dd/MM/yyyy}</p>
                            
                            <!-- Customer Info -->
                            <div style='background-color: #FFFFFF; border: 1px solid #E2D5C4; padding: 20px; border-radius: 12px; margin-bottom: 30px;'>
                                <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Người nhận:</span> <strong>{order.CustomerName}</strong></p>
                                <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Điện thoại:</span> <strong>{order.CustomerPhone}</strong></p>
                                <p style='margin: 0 0 10px 0; color: #3D3028;'><span style='color: #7B6858; display: inline-block; width: 100px;'>Địa chỉ:</span> <strong>{order.CustomerAddress}</strong></p>
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
                                        <td style='padding: 6px; text-align: right; color: #E9B949;'>Giảm giá ({order.DiscountCodeApplied}):</td>
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
                        <div style='background-color: #31572C; padding: 25px; text-align: center;'>
                            <p style='margin: 0 0 5px 0; color: #E9B949; font-weight: 600; font-size: 14px;'>Nguyệt Nhãn Phố Hiến</p>
                            <p style='margin: 0; color: #FFF9ED; font-size: 13px; opacity: 0.8;'>Mang hương vị quê hương đến căn bếp Việt</p>
                            <div style='margin-top: 15px; font-size: 12px; color: #FFF9ED; opacity: 0.6;'>
                                <a href='{_frontendBaseUrl}' style='color: #FFF9ED; text-decoration: underline;'>Website</a> &bull; Hotline: 09xx xxx xxx
                            </div>
                        </div>
                    </div>
                </div>";

            // Gửi cho khách và admin TÁCH RIÊNG: một bên fail không chặn bên còn lại.
            // EmailService đã tự retry 3 lần — tới đây vẫn fail thì log ERROR để gửi thủ công.
            if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
            {
                try
                {
                    await _emailService.SendEmailAsync(order.CustomerEmail, $"Xác nhận đơn hàng #{order.Id.ToString().Substring(0, 8)} - Nguyệt Nhãn Phố Hiến", invoiceHtml);
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
                string adminSummaryItems = string.Join("<br/>", order.Items.Select(i => $"- {i.ProductName} {(string.IsNullOrWhiteSpace(i.ProductSize) ? "" : $"({i.ProductSize})")} x{i.Quantity} ({i.TotalPrice:N0}đ)"));
                string adminHtml = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #ddd;'>
                    <h2 style='color: #E53935;'>CÓ ĐƠN HÀNG MỚI ({order.Items.Count} loại sản phẩm)</h2>
                    <p><strong>Khách hàng:</strong> {order.CustomerName} ({order.CustomerPhone})</p>
                    <p><strong>Email:</strong> {order.CustomerEmail ?? "Không có"}</p>
                    <p><strong>Địa chỉ:</strong> {order.CustomerAddress}</p>
                    <p><strong>Sản phẩm mua:</strong><br/>{adminSummaryItems}</p>
                    <p><strong>Tổng thanh toán:</strong> {order.TotalAmount:N0} đ</p>
                    <p><strong>Ghi chú:</strong> {order.Note ?? "Không"}</p>
                    <p><a href='{_frontendBaseUrl}/orders'>Vào Dashboard để xem chi tiết</a></p>
                </div>";

                try
                {
                    await _emailService.SendEmailAsync(adminEmail, $"Đơn hàng mới từ {order.CustomerName}", adminHtml);
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
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(MapToResponse);
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(Guid id)
    {
        var order = await _db.Orders
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

        if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
            throw new ArgumentException($"Trạng thái không hợp lệ: {status}");

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToResponse(order);
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
        await SendOrderEmailsAsync(order, adminNotify: false, throwOnFailure: true);

        _logger.LogInformation(
            "[Admin] Đã gửi lại hóa đơn đơn hàng {OrderId} tới khách {Email}.", id, order.CustomerEmail);
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
