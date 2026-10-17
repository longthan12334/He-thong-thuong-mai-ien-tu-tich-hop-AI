using Ecommerce.Common.DTOs;
using Ecommerce.Common.Enums;

namespace Ecommerce.BLL.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<bool> SendPasswordResetOtpAsync(ForgotPasswordDto request);
    Task<bool> VerifyOtpAsync(VerifyOtpDto request);
    Task<bool> ResetPasswordAsync(ResetPasswordDto request);
}

public interface IProductService
{
    Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductFilterDto filter);
    Task<ProductDto> GetProductByIdAsync(int id);
    Task<ProductDto> GetProductBySlugAsync(string slug);
    Task<ProductDto> CreateProductAsync(CreateProductDto request, int sellerId);
    Task<ProductDto> UpdateProductAsync(int id, CreateProductDto request, int? currentUserId = null, string? currentRole = null);
    Task<bool> DeleteProductAsync(int id, int? currentUserId = null, string? currentRole = null);
    Task<List<CategoryDto>> GetCategoriesAsync();
}

public interface IOrderService
{
    Task<List<OrderDto>> GetOrdersAsync(OrderStatus? status = null, int? userId = null, string? role = null);
    Task<OrderDto> GetOrderByIdAsync(int id, int? userId = null, string? role = null);
    Task<OrderDto> GetOrderByCodeAsync(string orderCode);
    Task<OrderDto> CreateOrderAsync(CreateOrderDto request, int? userId = null);
    Task<OrderDto> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto request, string? role = null);
}

public interface IInventoryService
{
    Task<InventorySummaryDto> GetInventorySummaryAsync(int? sellerId = null, string? role = null);
    Task<bool> RestockProductAsync(RestockRequestDto request);
}

public interface IStatisticsService
{
    Task<IncomeSummaryDto> GetIncomeStatisticsAsync(int? sellerId = null, string? role = null);
}

public interface IAIService
{
    Task<string> GenerateOutfitRecommendationAsync(string query, int? productId = null);
}

public interface IStoreService
{
    Task<List<StoreDto>> GetAllStoresAsync();
    Task<StoreDto?> GetStoreByCodeAsync(string storeCode);
    Task<StoreDto?> UpdateStoreAsync(string storeCode, UpdateStoreDto dto);
}
