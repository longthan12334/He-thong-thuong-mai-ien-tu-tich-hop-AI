using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.BLL.Services;

public class AdminService : IAdminService
{
    private readonly IUnitOfWork _unitOfWork;

    private static PlatformSettingsDto _settings = new();

    private static readonly List<AdminPayoutDto> _payouts = new()
    {
        new AdminPayoutDto
        {
            Id = 1,
            SellerId = 2,
            SellerName = "Gucci Flagship Store",
            SellerEmail = "gucci.boutique@gmail.com",
            Amount = 145000000m,
            BankName = "Vietcombank (VCB)",
            BankAccountNumber = "0011004567890",
            BankAccountName = "CONG TY TNHH GUCCI VIET NAM",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            Note = "Đối soát doanh thu kỳ 1 tháng 10"
        },
        new AdminPayoutDto
        {
            Id = 2,
            SellerId = 3,
            SellerName = "Dior Maison Haute",
            SellerEmail = "dior.vn@gmail.com",
            Amount = 89000000m,
            BankName = "Techcombank (TCB)",
            BankAccountNumber = "19034567891011",
            BankAccountName = "CONG TY TNHH DIOR VIET NAM",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            Note = "Đối soát thanh toán tuần 42"
        },
        new AdminPayoutDto
        {
            Id = 3,
            SellerId = 4,
            SellerName = "Chanel Official Boutique",
            SellerEmail = "chanel.boutique@gmail.com",
            Amount = 210000000m,
            BankName = "BIDV",
            BankAccountNumber = "12410002345678",
            BankAccountName = "CHANEL VIETNAM LLC",
            Status = "Approved",
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            ProcessedAt = DateTime.UtcNow.AddDays(-4),
            TransactionRef = "VCB-FT241025-998812",
            Note = "Đã chuyển khoản thành công"
        }
    };

    public AdminService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AdminDashboardStatsDto> GetDashboardStatsAsync()
    {
        // 1. Thống kê Seller
        var sellerQuery = _unitOfWork.Users.Query().Where(u => u.Role == UserRole.Seller);
        var totalSellers = await sellerQuery.CountAsync();
        var pendingKycSellers = await sellerQuery.CountAsync(u => u.SellerStatus == "PendingKYC");
        var suspendedSellers = await sellerQuery.CountAsync(u => u.SellerStatus == "Suspended");
        var activeSellers = totalSellers - pendingKycSellers - suspendedSellers;

        // 2. Thống kê Hàng hóa & Danh mục
        var totalProducts = await _unitOfWork.Products.Query().CountAsync();
        var totalCategories = await _unitOfWork.Categories.Query().CountAsync();

        // 3. Thống kê Giao dịch GMV & Hoa hồng sàn 3.5%
        var orders = await _unitOfWork.Orders.Query()
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var validOrders = orders.Where(o => o.Status != OrderStatus.Cancelled).ToList();
        var grossGmv = validOrders.Sum(o => o.TotalAmount);
        var platformCommission = Math.Round(grossGmv * 0.035m, 0);
        var escrowBalance = grossGmv - platformCommission;

        var totalOrders = orders.Count;
        var pendingOrders = orders.Count(o => o.Status == OrderStatus.Pending);
        var totalCustomers = await _unitOfWork.Users.Query().CountAsync(u => u.Role == UserRole.Customer);

        // 4. Ma trận doanh thu GMV 12 tháng
        var currentYear = DateTime.UtcNow.Year;
        var monthNames = new[] { "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" };
        var monthlyGmvList = new List<AdminMonthlyGmvDto>();

        for (int m = 1; m <= 12; m++)
        {
            var mOrders = validOrders.Where(o => o.CreatedAt.Year == currentYear && o.CreatedAt.Month == m).ToList();
            var mRevenue = mOrders.Sum(o => o.TotalAmount);
            monthlyGmvList.Add(new AdminMonthlyGmvDto
            {
                Month = monthNames[m - 1],
                Revenue = mRevenue,
                OrderCount = mOrders.Count,
                AverageOrderValue = mOrders.Count > 0 ? Math.Round(mRevenue / mOrders.Count, 0) : 0
            });
        }

        // Tăng trưởng so với tháng trước
        var currentMonth = DateTime.UtcNow.Month;
        var currentMonthRevenue = monthlyGmvList[currentMonth - 1].Revenue;
        var previousMonthRevenue = currentMonth > 1 ? monthlyGmvList[currentMonth - 2].Revenue : 0;
        double growthRate = previousMonthRevenue > 0
            ? Math.Round((double)((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100, 1)
            : 18.5;

        // 5. Hàng đợi hành động cần xử lý (Pending Actions)
        var pendingActions = new List<AdminActionItemDto>();

        var pendingKycList = await sellerQuery
            .Where(u => u.SellerStatus == "PendingKYC")
            .OrderByDescending(u => u.Id)
            .Take(5)
            .ToListAsync();

        foreach (var s in pendingKycList)
        {
            pendingActions.Add(new AdminActionItemDto
            {
                Id = $"KYC-{s.Id}",
                Type = "KYC",
                Title = $"Duyệt hồ sơ gian hàng: {s.FullName}",
                Subtitle = s.KycNotes ?? "Yêu cầu cấp chứng nhận Mall & mở quyền niêm yết sản phẩm",
                TimeAgo = "Mới cập nhật",
                Status = "Pending"
            });
        }

        var pendingOrderList = orders
            .Where(o => o.Status == OrderStatus.Pending)
            .Take(3)
            .ToList();

        foreach (var ord in pendingOrderList)
        {
            pendingActions.Add(new AdminActionItemDto
            {
                Id = $"ORD-{ord.Id}",
                Type = "Order",
                Title = $"Đơn hàng mới chờ điều phối: #{ord.OrderCode}",
                Subtitle = $"Trị giá {ord.TotalAmount:N0} đ • Người nhận: {ord.CustomerName}",
                TimeAgo = "Đang chờ",
                Status = "Pending"
            });
        }

        return new AdminDashboardStatsDto
        {
            TotalSellers = totalSellers,
            ActiveSellers = activeSellers,
            PendingKycSellers = pendingKycSellers,
            SuspendedSellers = suspendedSellers,
            TotalProducts = totalProducts,
            TotalCategories = totalCategories,
            GrossGmv = grossGmv,
            PlatformCommission = platformCommission,
            EscrowBalance = escrowBalance,
            TotalOrders = totalOrders,
            PendingOrders = pendingOrders,
            TotalCustomers = totalCustomers,
            MonthlyGrowthRate = growthRate,
            MonthlyGmv = monthlyGmvList,
            PendingActions = pendingActions
        };
    }

    public async Task<AdminSellerListResponseDto> GetSellersAsync(string? status = null, string? search = null, int page = 1, int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var baseQuery = _unitOfWork.Users.Query().Where(u => u.Role == UserRole.Seller);

        var totalAll = await baseQuery.CountAsync();
        var totalPendingKyc = await baseQuery.CountAsync(u => u.SellerStatus == "PendingKYC");
        var totalSuspended = await baseQuery.CountAsync(u => u.SellerStatus == "Suspended");
        var totalActive = totalAll - totalPendingKyc - totalSuspended;

        var statusCounts = new Dictionary<string, int>
        {
            ["All"] = totalAll,
            ["Active"] = totalActive,
            ["PendingKYC"] = totalPendingKyc,
            ["Suspended"] = totalSuspended
        };

        var query = baseQuery;

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (status.Equals("Active", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.SellerStatus == "Active" || string.IsNullOrEmpty(u.SellerStatus));
            }
            else
            {
                query = query.Where(u => u.SellerStatus == status);
            }
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(searchLower) || u.Email.ToLower().Contains(searchLower));
        }

        var totalCount = await query.CountAsync();

        var sellers = await query
            .OrderBy(u => u.SellerStatus == "PendingKYC" ? 0 : (u.SellerStatus == "Suspended" ? 2 : 1))
            .ThenBy(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var sellerIds = sellers.Select(s => s.Id).ToList();

        var productCounts = await _unitOfWork.Products.Query()
            .Where(p => sellerIds.Contains(p.SellerId))
            .GroupBy(p => p.SellerId)
            .Select(g => new { SellerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.SellerId, x => x.Count);

        var validOrderItems = await _unitOfWork.OrderItems.Query()
            .Include(oi => oi.Product)
            .Where(oi => oi.Product != null && sellerIds.Contains(oi.Product.SellerId) && oi.Order != null && oi.Order.Status != OrderStatus.Cancelled)
            .Select(oi => new { SellerId = oi.Product!.SellerId, Amount = oi.Price * oi.Quantity })
            .ToListAsync();

        var sellerRevenues = validOrderItems
            .GroupBy(x => x.SellerId)
            .ToDictionary(g => g.Key, g => g.Sum(x => x.Amount));

        var items = sellers.Select(s =>
        {
            var prodCount = productCounts.TryGetValue(s.Id, out var pc) ? pc : 0;
            var rev = sellerRevenues.TryGetValue(s.Id, out var r) ? r : 0;

            return new AdminSellerDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email,
                PhoneNumber = s.PhoneNumber,
                AvatarUrl = s.AvatarUrl,
                SellerStatus = string.IsNullOrEmpty(s.SellerStatus) ? "Active" : s.SellerStatus,
                IsMallVerified = s.IsMallVerified,
                SuspendedReason = s.SuspendedReason,
                KycNotes = s.KycNotes,
                CommissionRate = s.CommissionRate > 0 ? s.CommissionRate : 3.5m,
                TotalProducts = prodCount,
                TotalOrders = 0,
                TotalRevenue = rev,
                CreatedAt = s.CreatedAt,
                StoreCount = 1,
                MainStoreAddress = "Aethelgard Luxury Partner Boutique"
            };
        }).ToList();

        return new AdminSellerListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            StatusCounts = statusCounts
        };
    }

    public async Task<AdminSellerDto> GetSellerByIdAsync(int sellerId)
    {
        var s = await _unitOfWork.Users.Query()
            .FirstOrDefaultAsync(u => u.Id == sellerId && u.Role == UserRole.Seller);

        if (s == null)
        {
            throw new NotFoundException($"Không tìm thấy gian hàng đối tác với ID: {sellerId}");
        }

        var prodCount = await _unitOfWork.Products.Query().CountAsync(p => p.SellerId == s.Id);
        var rev = await _unitOfWork.OrderItems.Query()
            .Where(oi => oi.Product != null && oi.Product.SellerId == s.Id && oi.Order != null && oi.Order.Status != OrderStatus.Cancelled)
            .SumAsync(oi => oi.Price * oi.Quantity);

        return new AdminSellerDto
        {
            Id = s.Id,
            FullName = s.FullName,
            Email = s.Email,
            PhoneNumber = s.PhoneNumber,
            AvatarUrl = s.AvatarUrl,
            SellerStatus = string.IsNullOrEmpty(s.SellerStatus) ? "Active" : s.SellerStatus,
            IsMallVerified = s.IsMallVerified,
            SuspendedReason = s.SuspendedReason,
            KycNotes = s.KycNotes,
            CommissionRate = s.CommissionRate > 0 ? s.CommissionRate : 3.5m,
            TotalProducts = prodCount,
            TotalOrders = 0,
            TotalRevenue = rev,
            CreatedAt = s.CreatedAt,
            StoreCount = 1,
            MainStoreAddress = "Aethelgard Luxury Partner Boutique"
        };
    }

    public async Task<AdminSellerDto> UpdateSellerStatusAsync(int sellerId, AdminSellerStatusUpdateDto dto)
    {
        var s = await _unitOfWork.Users.Query()
            .FirstOrDefaultAsync(u => u.Id == sellerId && u.Role == UserRole.Seller);

        if (s == null)
        {
            throw new NotFoundException($"Không tìm thấy gian hàng đối tác với ID: {sellerId}");
        }

        if (!string.IsNullOrWhiteSpace(dto.SellerStatus))
        {
            s.SellerStatus = dto.SellerStatus;
            if (dto.SellerStatus == "Active")
            {
                s.SuspendedReason = null;
            }
        }

        if (dto.IsMallVerified.HasValue)
        {
            s.IsMallVerified = dto.IsMallVerified.Value;
        }

        if (dto.SuspendedReason != null)
        {
            s.SuspendedReason = dto.SuspendedReason;
        }

        if (dto.KycNotes != null)
        {
            s.KycNotes = dto.KycNotes;
        }

        s.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(s);
        await _unitOfWork.SaveChangesAsync();

        return await GetSellerByIdAsync(sellerId);
    }

    // 6. Quản lý người dùng toàn sàn (Task 9, 10, 11)
    public async Task<AdminUserListResponseDto> GetUsersAsync(string? search = null, string? role = null, bool? isActive = null, int page = 1, int pageSize = 25)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 25;

        var baseQuery = _unitOfWork.Users.Query();

        var totalAll = await baseQuery.CountAsync();
        var totalCustomers = await baseQuery.CountAsync(u => u.Role == UserRole.Customer);
        var totalSellers = await baseQuery.CountAsync(u => u.Role == UserRole.Seller);
        var totalAdmins = await baseQuery.CountAsync(u => u.Role == UserRole.Admin);

        var roleCounts = new Dictionary<string, int>
        {
            ["All"] = totalAll,
            ["Customer"] = totalCustomers,
            ["Seller"] = totalSellers,
            ["Admin"] = totalAdmins
        };

        var query = baseQuery;

        if (!string.IsNullOrWhiteSpace(role) && !role.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            if (Enum.TryParse<UserRole>(role, true, out var r))
            {
                query = query.Where(u => u.Role == r);
            }
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var sLower = search.Trim().ToLower();
            query = query.Where(u => u.FullName.ToLower().Contains(sLower) || u.Email.ToLower().Contains(sLower) || (u.PhoneNumber != null && u.PhoneNumber.Contains(sLower)));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userIds = users.Select(u => u.Id).ToList();

        var orderStats = await _unitOfWork.Orders.Query()
            .Where(o => o.UserId.HasValue && userIds.Contains(o.UserId.Value) && o.Status != OrderStatus.Cancelled)
            .GroupBy(o => o.UserId!.Value)
            .Select(g => new { UserId = g.Key, TotalSpent = g.Sum(x => x.TotalAmount), Count = g.Count() })
            .ToDictionaryAsync(x => x.UserId, x => x);

        var items = users.Select(u =>
        {
            var spent = orderStats.TryGetValue(u.Id, out var stat) ? stat.TotalSpent : 0;
            var oCount = stat != null ? stat.Count : 0;

            return new AdminUserDto
            {
                Id = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                AvatarUrl = u.AvatarUrl,
                Role = u.Role.ToString(),
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                TotalSpent = spent,
                OrderCount = oCount
            };
        }).ToList();

        return new AdminUserListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            RoleCounts = roleCounts
        };
    }

    public async Task<AdminUserDto> UpdateUserStatusAsync(int userId, AdminUserStatusUpdateDto dto)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            throw new NotFoundException($"Không tìm thấy người dùng với ID: {userId}");

        if (dto.IsActive.HasValue)
        {
            user.IsActive = dto.IsActive.Value;
        }

        if (!string.IsNullOrWhiteSpace(dto.Role) && Enum.TryParse<UserRole>(dto.Role, true, out var r))
        {
            user.Role = r;
        }

        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var spent = await _unitOfWork.Orders.Query()
            .Where(o => o.UserId == user.Id && o.Status != OrderStatus.Cancelled)
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        var oCount = await _unitOfWork.Orders.Query()
            .CountAsync(o => o.UserId == user.Id);

        return new AdminUserDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role.ToString(),
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
            TotalSpent = spent,
            OrderCount = oCount
        };
    }

    // 7. Kiểm duyệt sản phẩm toàn sàn (Task 15)
    public async Task<AdminProductListResponseDto> GetProductsAsync(string? search = null, int? categoryId = null, bool? isActive = null, int page = 1, int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query = _unitOfWork.Products.Query().Include(p => p.Category).AsQueryable();

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var sLower = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(sLower) || p.Sku.ToLower().Contains(sLower));
        }

        var totalCount = await query.CountAsync();

        var products = await query
            .OrderByDescending(p => p.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var sellerIds = products.Select(p => p.SellerId).Distinct().ToList();
        var sellers = await _unitOfWork.Users.Query()
            .Where(u => sellerIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName);

        var items = products.Select(p => new AdminProductDto
        {
            Id = p.Id,
            Name = p.Name,
            Sku = p.Sku,
            BasePrice = p.BasePrice,
            DiscountPercent = p.DiscountPercent,
            StockQuantity = p.StockQuantity,
            IsActive = p.IsActive,
            CategoryId = p.CategoryId,
            CategoryName = p.Category?.Name ?? "Thời Trang",
            SellerId = p.SellerId,
            SellerName = sellers.TryGetValue(p.SellerId, out var sName) ? sName : $"Shop #{p.SellerId}",
            ImageUrl = p.ImageUrl,
            CreatedAt = p.CreatedAt
        }).ToList();

        return new AdminProductListResponseDto
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<AdminProductDto> UpdateProductStatusAsync(int productId, AdminProductStatusUpdateDto dto)
    {
        var product = await _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId);

        if (product == null)
            throw new NotFoundException($"Không tìm thấy sản phẩm với ID: {productId}");

        product.IsActive = dto.IsActive;
        product.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync();

        var seller = await _unitOfWork.Users.GetByIdAsync(product.SellerId);

        return new AdminProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Sku = product.Sku,
            BasePrice = product.BasePrice,
            DiscountPercent = product.DiscountPercent,
            StockQuantity = product.StockQuantity,
            IsActive = product.IsActive,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? "Thời Trang",
            SellerId = product.SellerId,
            SellerName = seller?.FullName ?? $"Shop #{product.SellerId}",
            ImageUrl = product.ImageUrl,
            CreatedAt = product.CreatedAt
        };
    }

    // 8. Đối soát & duyệt chi trả rút tiền Seller (Task 20)
    public Task<List<AdminPayoutDto>> GetPayoutsAsync(string? status = null)
    {
        lock (_payouts)
        {
            var res = _payouts.AsEnumerable();
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                res = res.Where(p => p.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
            }
            return Task.FromResult(res.OrderByDescending(p => p.CreatedAt).ToList());
        }
    }

    public Task<AdminPayoutDto> ProcessPayoutAsync(int payoutId, AdminPayoutActionDto dto)
    {
        lock (_payouts)
        {
            var payout = _payouts.FirstOrDefault(p => p.Id == payoutId);
            if (payout == null)
                throw new NotFoundException($"Không tìm thấy yêu cầu rút tiền #{payoutId}");

            payout.Status = dto.Status;
            payout.ProcessedAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.TransactionRef)) payout.TransactionRef = dto.TransactionRef;
            if (!string.IsNullOrWhiteSpace(dto.Note)) payout.Note = dto.Note;

            return Task.FromResult(payout);
        }
    }

    // 9. Cấu hình sàn & hoa hồng (Task 19)
    public Task<PlatformSettingsDto> GetSettingsAsync()
    {
        return Task.FromResult(_settings);
    }

    public Task<PlatformSettingsDto> UpdateSettingsAsync(PlatformSettingsDto settings)
    {
        _settings = settings;
        return Task.FromResult(_settings);
    }
}
