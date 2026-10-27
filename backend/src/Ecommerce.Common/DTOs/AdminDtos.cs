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
