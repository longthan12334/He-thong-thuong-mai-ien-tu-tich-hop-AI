namespace Ecommerce.Common.DTOs;

public class AdminDashboardStatsDto
{
    public int TotalSellers { get; set; }
    public int ActiveSellers { get; set; }
    public int PendingKycSellers { get; set; }
    public int SuspendedSellers { get; set; }
    public int TotalProducts { get; set; }
    public int TotalCategories { get; set; }
    public decimal GrossGmv { get; set; }
    public decimal PlatformCommission { get; set; }
    public decimal EscrowBalance { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int TotalCustomers { get; set; }
    public double MonthlyGrowthRate { get; set; }
    public List<AdminMonthlyGmvDto> MonthlyGmv { get; set; } = new();
    public List<AdminActionItemDto> PendingActions { get; set; } = new();
}

public class AdminMonthlyGmvDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int OrderCount { get; set; }
    public decimal AverageOrderValue { get; set; }
}

public class AdminActionItemDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "KYC", "Payout", "Report"
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string TimeAgo { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}

public class AdminSellerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string SellerStatus { get; set; } = "Active"; // "Active", "PendingKYC", "Suspended"
    public bool IsMallVerified { get; set; } = true;
    public string? SuspendedReason { get; set; }
    public string? KycNotes { get; set; }
    public decimal CommissionRate { get; set; } = 3.5m;
    public int TotalProducts { get; set; }
    public int TotalOrders { get; set; }
    public decimal TotalRevenue { get; set; }
    public DateTime CreatedAt { get; set; }
    public int StoreCount { get; set; }
    public string? MainStoreAddress { get; set; }
}

public class AdminSellerStatusUpdateDto
{
    public string? SellerStatus { get; set; } // "Active", "PendingKYC", "Suspended"
    public bool? IsMallVerified { get; set; }
    public string? SuspendedReason { get; set; }
    public string? KycNotes { get; set; }
}

public class AdminSellerListResponseDto
{
    public List<AdminSellerDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public Dictionary<string, int> StatusCounts { get; set; } = new();
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "Customer";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public decimal TotalSpent { get; set; }
    public int OrderCount { get; set; }
}

public class AdminUserListResponseDto
{
    public List<AdminUserDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public Dictionary<string, int> RoleCounts { get; set; } = new();
}

public class AdminUserStatusUpdateDto
{
    public bool? IsActive { get; set; }
    public string? Role { get; set; }
}

public class AdminPayoutDto
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccountNumber { get; set; } = string.Empty;
    public string BankAccountName { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // "Pending", "Approved", "Rejected"
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public string? TransactionRef { get; set; }
    public string? Note { get; set; }
}

public class AdminPayoutActionDto
{
    public string Status { get; set; } = "Approved"; // "Approved", "Rejected"
    public string? TransactionRef { get; set; }
    public string? Note { get; set; }
}

public class AdminProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal? DiscountPercent { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminProductListResponseDto
{
    public List<AdminProductDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class AdminProductStatusUpdateDto
{
    public bool IsActive { get; set; }
    public string? ModerationNote { get; set; }
}

public class PlatformSettingsDto
{
    public decimal DefaultCommissionRate { get; set; } = 3.5m;
    public decimal MallCommissionRate { get; set; } = 2.5m;
    public int EscrowHoldDays { get; set; } = 7;
    public decimal MinPayoutAmount { get; set; } = 500000m;
    public string SupportEmail { get; set; } = "concierge@aethelgard.com";
    public string SupportHotline { get; set; } = "1900 8888 99";
    public bool MaintenanceMode { get; set; } = false;
}
