using System.Security.Claims;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
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
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [Authorize(Roles = "Seller,Admin")]
    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto request)
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        var result = await _orderService.UpdateOrderStatusAsync(id, request, roleClaim);
        return Ok(result);
    }
}
