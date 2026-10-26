using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;

using Microsoft.EntityFrameworkCore;

namespace Ecommerce.BLL.Services;

public class InventoryService : IInventoryService
{
    private readonly IUnitOfWork _unitOfWork;

    public InventoryService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<InventorySummaryDto> GetInventorySummaryAsync(int? sellerId = null, string? role = null)
    {
        // Chặn quyền truy cập nếu là tài khoản Khách hàng
        if (role == "Customer")
        {
            throw new UnauthorizedException("Khách mua hàng không có quyền truy cập dữ liệu tồn kho quản trị.");
        }

        var query = _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Where(p => p.IsActive);

        // Seller chỉ thấy sản phẩm của chính mình, Admin thấy toàn bộ
        if (sellerId.HasValue && role != "Admin")
        {
            query = query.Where(p => p.SellerId == sellerId.Value);
        }

        var products = await query.ToListAsync();

        var totalSku = products.Count;
        var totalStockItems = products.Sum(p => p.StockQuantity);
        var totalStockValue = products.Sum(p => p.BasePrice * p.StockQuantity);
        var lowStockCount = products.Count(p => p.StockQuantity <= 10);

        var items = products.Select(p => new InventoryItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Sku = p.Sku,
            CategoryName = p.Category?.Name ?? "Fashion",
            ImageUrl = p.ImageUrl,
            Price = p.BasePrice,
            StockQuantity = p.StockQuantity,
            StockStatus = p.StockQuantity == 0 ? "OUT_OF_STOCK" : (p.StockQuantity <= 10 ? "LOW_STOCK" : "IN_STOCK"),
            SafetyThreshold = 10
        }).ToList();

        return new InventorySummaryDto
        {
            TotalSku = totalSku,
            TotalStockItems = totalStockItems,
            TotalStockValue = totalStockValue,
            LowStockAlertCount = lowStockCount,
            Items = items
        };
    }

    public async Task<bool> RestockProductAsync(RestockRequestDto request, int? sellerId = null, string? role = null)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(request.ProductId);
        if (product == null)
            throw new NotFoundException("Sản phẩm", request.ProductId);

        // Khách hàng không có quyền nhập hàng
        if (role == "Customer")
        {
            throw new UnauthorizedException("Khách mua hàng không có quyền nhập hàng.");
        }

        // Seller chỉ được nhập hàng cho sản phẩm thuộc quyền sở hữu của chính mình
        if (role == "Seller")
        {
            if (!sellerId.HasValue || product.SellerId != sellerId.Value)
                throw new UnauthorizedException("Bạn không có quyền nhập hàng cho sản phẩm của người bán khác.");
        }

        product.StockQuantity += request.AdditionalQuantity;
        if (product.StockQuantity > 10)
            product.StockStatus = StockStatus.InStock;
        else if (product.StockQuantity > 0)
            product.StockStatus = StockStatus.LowStock;

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }
}
