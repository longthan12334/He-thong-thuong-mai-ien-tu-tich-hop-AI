using System.Security.Claims;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    private bool IsAdmin()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        return roleClaim == "Admin";
    }

    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<AdminDashboardStatsDto>> GetDashboardStats()
    {
        // Cho phép truy cập nếu đã xác thực là Admin hoặc trong môi trường quản trị
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("sellers")]
    public async Task<ActionResult<AdminSellerListResponseDto>> GetSellers(
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var response = await _adminService.GetSellersAsync(status, search, page, pageSize);
        return Ok(response);
    }

    [HttpGet("sellers/{id:int}")]
    public async Task<ActionResult<AdminSellerDto>> GetSellerById(int id)
    {
        var seller = await _adminService.GetSellerByIdAsync(id);
        return Ok(seller);
    }

    [HttpPut("sellers/{id:int}/status")]
    public async Task<ActionResult<AdminSellerDto>> UpdateSellerStatus(int id, [FromBody] AdminSellerStatusUpdateDto dto)
    {
        var updated = await _adminService.UpdateSellerStatusAsync(id, dto);
        return Ok(new
        {
            success = true,
            message = "Cập nhật trạng thái đối tác thành công.",
            data = updated
        });
    }
}
