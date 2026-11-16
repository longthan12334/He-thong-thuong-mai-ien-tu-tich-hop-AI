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

    // 1. Dashboard stats
    [HttpGet("dashboard-stats")]
    public async Task<ActionResult<AdminDashboardStatsDto>> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    // 2. Sellers
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

    // 3. Quản lý người dùng toàn sàn (Task 9, 10, 11)
    [HttpGet("users")]
    public async Task<ActionResult<AdminUserListResponseDto>> GetUsers(
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        var result = await _adminService.GetUsersAsync(search, role, isActive, page, pageSize);
        return Ok(result);
    }

    [HttpPut("users/{id:int}/status")]
    public async Task<ActionResult<AdminUserDto>> UpdateUserStatus(int id, [FromBody] AdminUserStatusUpdateDto dto)
    {
        var updated = await _adminService.UpdateUserStatusAsync(id, dto);
        return Ok(new
        {
            success = true,
            message = "Cập nhật trạng thái người dùng thành công.",
            data = updated
        });
    }

    // 4. Kiểm duyệt sản phẩm toàn sàn (Task 15)
    [HttpGet("products")]
    public async Task<ActionResult<AdminProductListResponseDto>> GetProducts(
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetProductsAsync(search, categoryId, isActive, page, pageSize);
        return Ok(result);
    }

    [HttpPut("products/{id:int}/status")]
    public async Task<ActionResult<AdminProductDto>> UpdateProductStatus(int id, [FromBody] AdminProductStatusUpdateDto dto)
    {
        var updated = await _adminService.UpdateProductStatusAsync(id, dto);
        return Ok(new
        {
            success = true,
            message = "Cập nhật trạng thái kiểm duyệt sản phẩm thành công.",
            data = updated
        });
    }

    // 5. Đối soát & duyệt lệnh rút tiền (Task 20)
    [HttpGet("payouts")]
    public async Task<ActionResult<List<AdminPayoutDto>>> GetPayouts([FromQuery] string? status = null)
    {
        var payouts = await _adminService.GetPayoutsAsync(status);
        return Ok(payouts);
    }

    [HttpPost("payouts/{id:int}/process")]
    public async Task<ActionResult<AdminPayoutDto>> ProcessPayout(int id, [FromBody] AdminPayoutActionDto dto)
    {
        var result = await _adminService.ProcessPayoutAsync(id, dto);
        return Ok(new
        {
            success = true,
            message = $"Đã xử lý yêu cầu rút tiền: {dto.Status}.",
            data = result
        });
    }

    // 6. Cấu hình sàn & hoa hồng (Task 19)
    [HttpGet("settings")]
    public async Task<ActionResult<PlatformSettingsDto>> GetSettings()
    {
        var settings = await _adminService.GetSettingsAsync();
        return Ok(settings);
    }

    [HttpPut("settings")]
    public async Task<ActionResult<PlatformSettingsDto>> UpdateSettings([FromBody] PlatformSettingsDto settings)
    {
        var updated = await _adminService.UpdateSettingsAsync(settings);
        return Ok(new
        {
            success = true,
            message = "Cập nhật cấu hình sàn thành công.",
            data = updated
        });
    }
}
