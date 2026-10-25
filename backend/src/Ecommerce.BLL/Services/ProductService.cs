using AutoMapper;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;
using Ecommerce.Common.Enums;
using Ecommerce.Common.Exceptions;
using Ecommerce.DAL.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.BLL.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PagedResultDto<ProductDto>> GetProductsAsync(ProductFilterDto filter)
    {
        var query = _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .Where(p => p.IsActive);

        // Tìm kiếm theo từ khóa
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(search) ||
                                     p.Sku.ToLower().Contains(search) ||
                                     (p.CollectionName != null && p.CollectionName.ToLower().Contains(search)) ||
                                     p.Description.ToLower().Contains(search));
        }

        // Lọc theo người bán
        if (filter.SellerId.HasValue && filter.SellerId.Value > 0)
        {
            query = query.Where(p => p.SellerId == filter.SellerId.Value);
        }

        // Lọc theo danh mục
        if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        // Lọc theo khoảng giá
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice >= filter.MinPrice.Value);
        }
        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => p.BasePrice <= filter.MaxPrice.Value);
        }

        // Sort By
        query = filter.SortBy switch
        {
            "price_asc" => query.OrderBy(p => p.BasePrice),
            "price_desc" => query.OrderByDescending(p => p.BasePrice),
            "bestseller" => query.OrderByDescending(p => p.ReviewCount),
            "discount" => query.OrderByDescending(p => p.DiscountPercent),
            _ => query.OrderByDescending(p => p.Id) // newest
        };

        var totalCount = await query.CountAsync();
        var page = filter.Page > 0 ? filter.Page : 1;
        var pageSize = filter.PageSize > 0 ? filter.PageSize : 12;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResultDto<ProductDto>
        {
            Items = _mapper.Map<List<ProductDto>>(items),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ProductDto> GetProductByIdAsync(int id)
    {
        var product = await _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            throw new NotFoundException("Sản phẩm", id);

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> GetProductBySlugAsync(string slug)
    {
        // Slug luôn được lưu lowercase (xem GenerateSlug bên dưới).
        // Chỉ cần lowercase input — tránh LOWER() trên cột DB gây full table scan.
        var slugLower = slug.ToLower();
        var product = await _unitOfWork.Products.Query()
            .Include(p => p.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Slug == slugLower);

        if (product == null)
            throw new NotFoundException($"Không tìm thấy sản phẩm có slug '{slug}'.");

        return _mapper.Map<ProductDto>(product);
    }

    public async Task<ProductDto> CreateProductAsync(CreateProductDto request, int sellerId)
    {
        var slug = GenerateSlug(request.Name);
        var product = new Product
        {
            SellerId = sellerId,
            CategoryId = request.CategoryId,
            Name = request.Name,
            Slug = slug,
            Sku = request.Sku,
            CollectionName = request.CollectionName,
            Description = request.Description,
            BasePrice = request.BasePrice,
            OriginalPrice = request.OriginalPrice ?? request.BasePrice,
            ImageUrl = request.ImageUrl,
            StockQuantity = request.StockQuantity,
            StockStatus = request.StockQuantity > 0 ? StockStatus.InStock : StockStatus.OutOfStock,
            Material = request.Material,
            IsActive = true
        };

        await _unitOfWork.Products.AddAsync(product);
        await _unitOfWork.SaveChangesAsync();

        return await GetProductByIdAsync(product.Id);
    }

    public async Task<ProductDto> UpdateProductAsync(int id, CreateProductDto request, int? currentUserId = null, string? currentRole = null)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null)
            throw new NotFoundException("Sản phẩm", id);

        if (currentUserId.HasValue && currentRole != "Admin" && product.SellerId != currentUserId.Value)
        {
            throw new UnauthorizedException("Bạn không có quyền sửa sản phẩm của người bán khác.");
        }

        product.Name = request.Name;
        product.CategoryId = request.CategoryId;
        product.Sku = request.Sku;
        product.CollectionName = request.CollectionName;
        product.Description = request.Description;
        product.BasePrice = request.BasePrice;
        product.OriginalPrice = request.OriginalPrice;
        product.ImageUrl = request.ImageUrl;
        product.StockQuantity = request.StockQuantity;
        product.StockStatus = request.StockQuantity > 0 ? StockStatus.InStock : StockStatus.OutOfStock;
        product.Material = request.Material;

        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync();

        return await GetProductByIdAsync(id);
    }

    public async Task<bool> DeleteProductAsync(int id, int? currentUserId = null, string? currentRole = null)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(id);
        if (product == null)
            return false;

        if (currentUserId.HasValue && currentRole != "Admin" && product.SellerId != currentUserId.Value)
        {
            throw new UnauthorizedException("Bạn không có quyền xóa sản phẩm của người bán khác.");
        }

        product.IsActive = false;
        _unitOfWork.Products.Update(product);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _unitOfWork.Categories.Query()
            .Include(c => c.Products)
            .ToListAsync();

        return _mapper.Map<List<CategoryDto>>(categories);
    }

    public async Task<List<ReviewDto>> GetProductReviewsAsync(int productId)
    {
        var reviews = await _unitOfWork.Reviews.Query()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ReviewDto>>(reviews);
    }

    public async Task<ReviewDto> AddProductReviewAsync(int productId, CreateReviewDto request, int? userId = null)
    {
        var product = await _unitOfWork.Products.GetByIdAsync(productId);
        if (product == null)
            throw new NotFoundException("Sản phẩm", productId);

        var review = new Review
        {
            ProductId = productId,
            UserId = userId,
            CustomerName = string.IsNullOrWhiteSpace(request.CustomerName) ? "Khách Hàng Aethelgard" : request.CustomerName.Trim(),
            Rating = Math.Clamp(request.Rating, 1, 5),
            Comment = request.Comment?.Trim() ?? string.Empty,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Reviews.AddAsync(review);
        await _unitOfWork.SaveChangesAsync();

        var allReviews = await _unitOfWork.Reviews.Query()
            .Where(r => r.ProductId == productId)
            .ToListAsync();

        if (allReviews.Any())
        {
            product.Rating = Math.Round(allReviews.Average(r => r.Rating), 1);
            product.ReviewCount = allReviews.Count;
            _unitOfWork.Products.Update(product);
            await _unitOfWork.SaveChangesAsync();
        }

        return _mapper.Map<ReviewDto>(review);
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("/", "-")
            .Replace("'", "")
            .Replace("\"", "");
    }
}
