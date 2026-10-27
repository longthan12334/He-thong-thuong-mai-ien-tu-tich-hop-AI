using System.Security.Claims;
using Ecommerce.API.Hubs;
using Ecommerce.BLL.Interfaces;
using Ecommerce.BLL.Services;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Enums;
using Ecommerce.DAL.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IVnpayService _vnpayService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<NotificationHub> _hubContext;

    public OrdersController(
        IOrderService orderService,
        IVnpayService vnpayService,
        IUnitOfWork unitOfWork,
        IHubContext<NotificationHub> hubContext)
    {
        _orderService = orderService;
        _vnpayService = vnpayService;
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders([FromQuery] OrderStatus? status)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var result = await _orderService.GetOrdersAsync(status, userId, roleClaim);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var result = await _orderService.GetOrderByIdAsync(id, userId, roleClaim);
        return Ok(result);
    }

    [HttpGet("code/{orderCode}")]
    public async Task<ActionResult<OrderDto>> GetOrderByCode(string orderCode)
    {
        var result = await _orderService.GetOrderByCodeAsync(orderCode);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var result = await _orderService.CreateOrderAsync(request, userId);

        try
        {
            var pIds = result.Items
                .Where(it => it.ProductId.HasValue)
                .Select(it => it.ProductId!.Value)
                .Distinct()
                .ToList();

            var relevantSellers = await _unitOfWork.Products.Query()
                .Where(p => pIds.Contains(p.Id))
                .Select(p => p.SellerId)
                .Distinct()
                .ToListAsync();

            foreach (var sId in relevantSellers)
            {
                await _hubContext.Clients.Group($"Seller_{sId}").SendAsync("ReceiveOrderCreated", new
                {
                    orderId = result.Id,
                    orderCode = result.OrderCode,
                    customerName = result.CustomerName,
                    totalAmount = result.TotalAmount,
                    createdAt = result.CreatedAt,
                    title = "Đơn Hàng Mới Cho Gian Hàng!",
                    message = $"Khách hàng {result.CustomerName} vừa đặt đơn #{result.OrderCode} ({result.TotalAmount:N0} đ)."
                });
            }
        }
        catch { }

        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    /// <summary>[Customer] Khách hàng hủy đơn của chính mình khi đơn còn Chờ xác nhận.</summary>
    [Authorize]
    [HttpPatch("{id:int}/cancel")]
    public async Task<ActionResult<OrderDto>> CancelMyOrder(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return BadRequest(new { message = "Vui lòng đăng nhập để hủy đơn hàng." });

        var result = await _orderService.CancelOrderByCustomerAsync(id, userId);
        return Ok(result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

        var result = await _orderService.UpdateOrderStatusAsync(id, request, userId, roleClaim);

        try
        {
            // Gửi thông báo tới Người bán
            await _hubContext.Clients.Group("Sellers").SendAsync("ReceiveOrderStatusUpdated", new
            {
                orderId = result.Id,
                orderCode = result.OrderCode,
                status = result.Status,
                statusLabel = result.StatusLabel,
                title = "Trạng Thái Đơn Hàng Cập Nhật",
                message = $"Đơn hàng {result.OrderCode} đã chuyển sang: {result.StatusLabel}."
            });

            // Gửi thông báo riêng cho Khách hàng sở hữu đơn hàng
            if (!string.IsNullOrWhiteSpace(result.CustomerEmail))
            {
                await _hubContext.Clients.Group($"Customer_{result.CustomerEmail.Trim().ToLower()}").SendAsync("ReceiveOrderStatusUpdated", new
                {
                    orderId = result.Id,
                    orderCode = result.OrderCode,
                    status = result.Status,
                    statusLabel = result.StatusLabel,
                    title = "Cập Nhật Đơn Hàng Của Bạn",
                    message = $"Đơn hàng {result.OrderCode} của bạn đã chuyển sang trạng thái: {result.StatusLabel}."
                });
            }
        }
        catch { }

        return Ok(result);
    }

    [HttpPost("{id:int}/vnpay-url")]
    public async Task<IActionResult> CreateVnpayUrl(int id, [FromBody] VnpayUrlRequestDto? request)
    {
        var order = await _unitOfWork.Orders.GetByIdAsync(id);
        if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var returnUrl = request?.ReturnUrl ?? "http://localhost:5000/api/orders/vnpay-callback";

        var paymentUrl = _vnpayService.CreatePaymentUrl(order, clientIp, returnUrl);
        return Ok(new { paymentUrl });
    }

    [HttpGet("vnpay-callback")]
    public async Task<IActionResult> VnpayCallback()
    {
        var queryParams = Request.Query.ToDictionary(k => k.Key, v => v.Value.ToString());
        var isValid = _vnpayService.ValidateCallback(queryParams);

        if (!isValid)
        {
            return Redirect("http://localhost:3001/shop/track-order?vnpay=invalid_signature");
        }

        if (queryParams.TryGetValue("vnp_TxnRef", out var txnRef) && int.TryParse(txnRef, out var orderId))
        {
            var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
            if (order != null)
            {
                var responseCode = queryParams.GetValueOrDefault("vnp_ResponseCode");
                if (responseCode == "00")
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                    order.Status = OrderStatus.Processing;
                    _unitOfWork.Orders.Update(order);
                    await _unitOfWork.SaveChangesAsync();

                    try
                    {
                        // Gửi cho Người bán
                        await _hubContext.Clients.Group("Sellers").SendAsync("ReceivePaymentConfirmed", new
                        {
                            orderId = order.Id,
                            orderCode = order.OrderCode,
                            title = "Thanh Toán VNPay Thành Công!",
                            message = $"Đơn hàng {order.OrderCode} ({order.TotalAmount:N0} đ) vừa hoàn tất thanh toán trực tuyến qua VNPay."
                        });

                        // Gửi riêng cho Khách hàng
                        if (!string.IsNullOrWhiteSpace(order.CustomerEmail))
                        {
                            await _hubContext.Clients.Group($"Customer_{order.CustomerEmail.Trim().ToLower()}").SendAsync("ReceivePaymentConfirmed", new
                            {
                                orderId = order.Id,
                                orderCode = order.OrderCode,
                                title = "Thanh Toán Đơn Hàng Thành Công!",
                                message = $"Bạn đã thanh toán thành công cho đơn hàng {order.OrderCode} qua cổng VNPay Sandbox."
                            });
                        }
                    }
                    catch { }

                    var phoneParam = Uri.EscapeDataString(order.CustomerPhone ?? string.Empty);
                    return Redirect($"http://localhost:3001/shop/track-order?vnpay=success&code={order.OrderCode}&phone={phoneParam}");
                }

                return Redirect($"http://localhost:3001/shop/track-order?vnpay=cancel&code={order.OrderCode}");
            }
        }

        return Redirect("http://localhost:3001/shop/track-order?vnpay=failed");
    }
}
