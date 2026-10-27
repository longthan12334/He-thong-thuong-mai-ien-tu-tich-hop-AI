using Ecommerce.Common.DTOs;

namespace Ecommerce.BLL.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
    Task<AdminSellerListResponseDto> GetSellersAsync(string? status = null, string? search = null, int page = 1, int pageSize = 20);
    Task<AdminSellerDto> GetSellerByIdAsync(int sellerId);
    Task<AdminSellerDto> UpdateSellerStatusAsync(int sellerId, AdminSellerStatusUpdateDto dto);
}
