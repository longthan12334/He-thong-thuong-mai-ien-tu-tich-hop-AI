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
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value 
            ?? User.FindFirst("role")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        var result = await _orderService.GetOrdersAsync(status, userId, roleClaim);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value 
            ?? User.FindFirst("role")?.Value;
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
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value 
            ?? User.FindFirst("role")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;

        if (roleClaim == "Seller")
        {
            return BadRequest(new { message = "Tài khoản Người bán không được phép đặt hàng. Vui lòng sử dụng tài khoản Khách hàng để mua sắm." });
        }

        var result = await _orderService.CreateOrderAsync(request, userId, roleClaim);

        try
        {
            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
            var sellerIds = await _unitOfWork.Products.Query()
                .Where(p => productIds.Contains(p.Id) && p.SellerId > 0)
                .Select(p => p.SellerId)
                .Distinct()
                .ToListAsync();

            var orderCreatedPayload = new
            {
                orderId = result.Id,
                orderCode = result.OrderCode,
                customerName = result.CustomerName,
                totalAmount = result.TotalAmount,
                createdAt = result.CreatedAt,
                title = "Đơn Hàng Mới Cho Shop!",
                message = $"Khách hàng {result.CustomerName} vừa đặt đơn {result.OrderCode} ({result.TotalAmount:N0} đ)."
            };

            await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderCreated", orderCreatedPayload);
            foreach (var sellerId in sellerIds)
            {
                await _hubContext.Clients.Group($"Seller_{sellerId}").SendAsync("ReceiveOrderCreated", orderCreatedPayload);
            }

            // Đồng bộ tồn kho tức thì cho tất cả khách hàng đang xem sàn
            await _hubContext.Clients.All.SendAsync("ReceiveCatalogUpdated", new
            {
                productIds = productIds,
                orderCode = result.OrderCode
            });
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

        try
        {
            var productIds = result.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
            await _hubContext.Clients.All.SendAsync("ReceiveCatalogUpdated", new
            {
                productIds = productIds,
                orderCode = result.OrderCode
            });
        }
        catch { }

        return Ok(result);
    }

    /// <summary>[Customer] Khách hàng xác nhận đã nhận hàng thành công.</summary>
    [Authorize]
    [HttpPatch("{id:int}/confirm-received")]
    public async Task<ActionResult<OrderDto>> ConfirmReceived(int id)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        if (!int.TryParse(userIdClaim, out var userId))
            return BadRequest(new { message = "Vui lòng đăng nhập để xác nhận nhận hàng." });

        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value 
            ?? User.FindFirst("role")?.Value;

        var result = await _orderService.ConfirmOrderReceivedByCustomerAsync(id, userId, roleClaim);

        try
        {
            var productIds = result.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
            var sellerIds = await _unitOfWork.Products.Query()
                .Where(p => productIds.Contains(p.Id) && p.SellerId > 0)
                .Select(p => p.SellerId)
                .Distinct()
                .ToListAsync();

            var receivedPayload = new
            {
                orderId = result.Id,
                orderCode = result.OrderCode,
                status = result.Status,
                statusLabel = result.StatusLabel,
                title = "Khách Hàng Đã Nhận Hàng!",
                message = $"Khách hàng {result.CustomerName} đã xác nhận nhận thành công kiện hàng {result.OrderCode}."
            };

            await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderStatusUpdated", receivedPayload);
            foreach (var sellerId in sellerIds)
            {
                await _hubContext.Clients.Group($"Seller_{sellerId}").SendAsync("ReceiveOrderStatusUpdated", receivedPayload);
            }
        }
        catch { }

        return Ok(result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        int? userId = int.TryParse(userIdClaim, out var parsedId) ? parsedId : null;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value 
            ?? User.FindFirst("role")?.Value;

        var result = await _orderService.UpdateOrderStatusAsync(id, request, userId, roleClaim);

        try
        {
            var productIds = result.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
            var sellerIds = await _unitOfWork.Products.Query()
                .Where(p => productIds.Contains(p.Id) && p.SellerId > 0)
                .Select(p => p.SellerId)
                .Distinct()
                .ToListAsync();

            var statusPayload = new
            {
                orderId = result.Id,
                orderCode = result.OrderCode,
                status = result.Status,
                statusLabel = result.StatusLabel,
                title = "Trạng Thái Đơn Hàng Cập Nhật",
                message = $"Đơn hàng {result.OrderCode} đã chuyển sang: {result.StatusLabel}."
            };

            await _hubContext.Clients.Group("Admins").SendAsync("ReceiveOrderStatusUpdated", statusPayload);
            foreach (var sellerId in sellerIds)
            {
                await _hubContext.Clients.Group($"Seller_{sellerId}").SendAsync("ReceiveOrderStatusUpdated", statusPayload);
            }

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
            var order = await _unitOfWork.Orders.Query()
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == orderId);

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
                        var productIds = order.Items.Where(i => i.ProductId.HasValue).Select(i => i.ProductId!.Value).Distinct().ToList();
                        var sellerIds = await _unitOfWork.Products.Query()
                            .Where(p => productIds.Contains(p.Id) && p.SellerId > 0)
                            .Select(p => p.SellerId)
                            .Distinct()
                            .ToListAsync();

                        var paymentNotif = new
                        {
                            orderId = order.Id,
                            orderCode = order.OrderCode,
                            title = "Thanh Toán VNPay Thành Công!",
                            message = $"Đơn hàng {order.OrderCode} ({order.TotalAmount:N0} đ) vừa hoàn tất thanh toán trực tuyến qua VNPay."
                        };

                        await _hubContext.Clients.Group("Admins").SendAsync("ReceivePaymentConfirmed", paymentNotif);
                        foreach (var sellerId in sellerIds)
                        {
                            await _hubContext.Clients.Group($"Seller_{sellerId}").SendAsync("ReceivePaymentConfirmed", paymentNotif);
                        }

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
