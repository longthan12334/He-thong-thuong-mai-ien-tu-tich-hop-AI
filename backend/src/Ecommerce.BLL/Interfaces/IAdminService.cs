using Ecommerce.Common.DTOs;

namespace Ecommerce.BLL.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardStatsDto> GetDashboardStatsAsync();
    Task<AdminSellerListResponseDto> GetSellersAsync(string? status = null, string? search = null, int page = 1, int pageSize = 20);
    Task<AdminSellerDto> GetSellerByIdAsync(int sellerId);
    Task<AdminSellerDto> UpdateSellerStatusAsync(int sellerId, AdminSellerStatusUpdateDto dto);

    // Quản lý người dùng toàn sàn (Task 9, 10, 11)
    Task<AdminUserListResponseDto> GetUsersAsync(string? search = null, string? role = null, bool? isActive = null, int page = 1, int pageSize = 25);
    Task<AdminUserDto> UpdateUserStatusAsync(int userId, AdminUserStatusUpdateDto dto);

    // Kiểm duyệt sản phẩm toàn sàn (Task 15)
    Task<AdminProductListResponseDto> GetProductsAsync(string? search = null, int? categoryId = null, bool? isActive = null, int page = 1, int pageSize = 20);
    Task<AdminProductDto> UpdateProductStatusAsync(int productId, AdminProductStatusUpdateDto dto);

    // Đối soát & duyệt chi trả rút tiền Seller (Task 20)
    Task<List<AdminPayoutDto>> GetPayoutsAsync(string? status = null);
    Task<AdminPayoutDto> ProcessPayoutAsync(int payoutId, AdminPayoutActionDto dto);

    // Cấu hình sàn & hoa hồng (Task 19)
    Task<PlatformSettingsDto> GetSettingsAsync();
    Task<PlatformSettingsDto> UpdateSettingsAsync(PlatformSettingsDto settings);
}
