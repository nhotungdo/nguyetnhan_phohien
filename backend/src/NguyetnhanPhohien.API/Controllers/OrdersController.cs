using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NguyetnhanPhohien.Application.DTOs.Orders;
using NguyetnhanPhohien.Application.Interfaces;

namespace NguyetnhanPhohien.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

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

        try
        {
            var order = await _orderService.CreateOrderAsync(request);
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
