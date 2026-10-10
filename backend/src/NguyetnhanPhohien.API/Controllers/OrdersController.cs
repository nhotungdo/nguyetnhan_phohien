using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NguyetnhanPhohien.API.Hubs;
using NguyetnhanPhohien.Application.DTOs.Orders;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IHubContext<ProductsHub> _hub;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, IHubContext<ProductsHub> hub, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _hub = hub;
        _logger = logger;
    }

    /// <summary>
    /// Báo cho các tab Admin đang mở rằng đơn hàng đã thay đổi để họ tải lại ngay,
    /// không cần F5. Gửi vào group Admin (không phải Clients.All) để không phát thông
    /// tin vận hành nội bộ cho khách vãng lai. Lỗi broadcast KHÔNG được làm fail
    /// request đã ghi DB thành công.
    /// </summary>
    private async Task NotifyOrdersChangedAsync(string action, Guid orderId)
    {
        try
        {
            await _hub.Clients.Group(ProductsHub.AdminGroup).SendAsync(ProductsHub.OrdersChangedEvent, new
            {
                action,
                orderId,
                at = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Không broadcast được sự kiện đơn hàng {Action} ({OrderId})", action, orderId);
        }
    }

    // Giới hạn độ dài dữ liệu khách nhập. Endpoint này là PUBLIC nên không có gì
    // chặn một POST chứa chuỗi vài MB: nó sẽ được ghi vào bảng Orders, đưa vào email
    // HTML gửi admin và làm phình DB. Kiểm tra tường minh ở đây (thay vì DataAnnotations)
    // để thông báo lỗi về client vẫn đúng dạng { message } mà UI đang đọc.
    private const int MaxNameLength = 100;
    private const int MaxPhoneLength = 20;
    private const int MaxAddressLength = 300;
    private const int MaxEmailLength = 200;
    private const int MaxNoteLength = 1000;
    private const int MaxItemCount = 50;

    /// <summary>
    /// [PUBLIC] Khách hàng gửi đơn đặt hàng - không cần đăng nhập.
    /// Tổng tiền và số tiền giảm giá được tính lại hoàn toàn phía server.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerName) ||
            string.IsNullOrWhiteSpace(request.CustomerPhone) ||
            string.IsNullOrWhiteSpace(request.CustomerAddress))
        {
            return BadRequest(new { message = "Vui lòng điền đầy đủ thông tin: Tên, SĐT và Địa chỉ." });
        }

        if (request.CustomerName.Length > MaxNameLength)
            return BadRequest(new { message = $"Tên không được vượt quá {MaxNameLength} ký tự." });

        if (request.CustomerPhone.Length > MaxPhoneLength)
            return BadRequest(new { message = $"Số điện thoại không được vượt quá {MaxPhoneLength} ký tự." });

        if (request.CustomerAddress.Length > MaxAddressLength)
            return BadRequest(new { message = $"Địa chỉ không được vượt quá {MaxAddressLength} ký tự." });

        if (request.CustomerEmail is { Length: > MaxEmailLength })
            return BadRequest(new { message = $"Email không được vượt quá {MaxEmailLength} ký tự." });

        if (request.Note is { Length: > MaxNoteLength })
            return BadRequest(new { message = $"Ghi chú không được vượt quá {MaxNoteLength} ký tự." });

        if (request.Items is { Count: > MaxItemCount })
            return BadRequest(new { message = $"Đơn hàng không được có quá {MaxItemCount} dòng sản phẩm." });

        try
        {
            var order = await _orderService.CreateOrderAsync(request);
            await NotifyOrdersChangedAsync("created", order.Id);
            return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, order);
        }
        catch (ArgumentException ex)
        {
            // Sản phẩm không hợp lệ / mã giảm giá hết hạn hoặc hết lượt...
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// [ADMIN] Xem tất cả đơn hàng.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllOrders()
    {
        var orders = await _orderService.GetAllOrdersAsync();
        return Ok(orders);
    }

    /// <summary>
    /// [ADMIN] Xem chi tiết 1 đơn hàng.
    /// </summary>
    [HttpGet("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetOrderById(Guid id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
        return Ok(order);
    }

    /// <summary>
    /// [ADMIN] Cập nhật trạng thái đơn hàng.
    /// </summary>
    [HttpPut("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await _orderService.UpdateOrderStatusAsync(id, request.Status);
            await NotifyOrdersChangedAsync("status-changed", order.Id);
            return Ok(order);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// [ADMIN] Gửi lại hóa đơn qua email tới khách hàng.
    /// Dùng khi email tự động thất bại lần đầu hoặc khách yêu cầu nhận lại hóa đơn.
    /// </summary>
    [HttpPost("{id:guid}/resend-invoice")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResendInvoice(Guid id)
    {
        try
        {
            await _orderService.ResendInvoiceAsync(id);
            return Ok(new { message = "Hóa đơn đã được gửi lại thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Gửi hóa đơn thất bại: {ex.Message}" });
        }
    }
}
