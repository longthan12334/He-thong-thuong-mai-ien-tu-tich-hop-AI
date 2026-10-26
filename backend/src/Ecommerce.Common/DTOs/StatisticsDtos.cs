namespace Ecommerce.Common.DTOs;

public class IncomeSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal MonthlyRevenue { get; set; }
    public decimal WeeklyRevenue { get; set; }
    public decimal YearlyRevenue { get; set; }
    public int TotalOrders { get; set; }
    public int TotalCustomers { get; set; }
    public int NewCustomers { get; set; }
    public double ConversionRate { get; set; }
    public double GrowthPercent { get; set; }
    public List<MonthlyDataDto> MonthlyMatrix { get; set; } = new();
    public List<TransactionDto> RecentTransactions { get; set; } = new();
    public List<CategoryRevenueDto> CategoryBreakdown { get; set; } = new();
}

public class CategoryRevenueDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int ItemsSold { get; set; }
    public double Percentage { get; set; }
}

public class MonthlyDataDto
{
    public string Month { get; set; } = string.Empty; // JAN, FEB, MAR...
    public int ExistingUsers { get; set; }
    public int NewUsers { get; set; }
    public string ValTotal { get; set; } = string.Empty; // 14k, 56k...
    public bool IsActive { get; set; }
    public string? NewText { get; set; }
    public string? ExistText { get; set; }
}

public class TransactionDto
{
    public string Id { get; set; } = string.Empty; // AG-2026-7254
    public string Customer { get; set; } = string.Empty;
    public string Product { get; set; } = string.Empty;
    public string Status { get; set; } = "Success";
    public int Qty { get; set; }
    public string UnitPrice { get; set; } = string.Empty;
    public string Total { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}
