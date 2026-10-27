using Ecommerce.Common.Enums;

namespace Ecommerce.Common.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public int SellerId { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? CollectionName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int DiscountPercent { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> GalleryUrls { get; set; } = new();
    public int StockQuantity { get; set; }
    public string StockStatus { get; set; } = string.Empty;
    public string? Material { get; set; }
    public string? CareInstructions { get; set; }
    public string? PackagingDetails { get; set; }
    public string? CountryOfOrigin { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public bool IsActive { get; set; } = true;
    public List<ProductVariantDto> Variants { get; set; } = new();
}

public class ProductVariantDto
{
    public int Id { get; set; }
    public string Size { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
}

public class CreateProductDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? CollectionName { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal CostPrice { get; set; }
    public int DiscountPercent { get; set; } = 0;
    public string ImageUrl { get; set; } = string.Empty;
    public List<string> GalleryUrls { get; set; } = new();
    public int StockQuantity { get; set; }
    public string? Material { get; set; }
    public string? CareInstructions { get; set; }
    public string? CountryOfOrigin { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

public class ProductFilterDto
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public int? SellerId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string? SortBy { get; set; }
    public bool? InStockOnly { get; set; }
    public string? Collection { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

public class GenerateProductDescriptionRequestDto
{
    public string ProductName { get; set; } = string.Empty;
    public string? CategoryName { get; set; }
    public string? Brand { get; set; }
    public string? Keywords { get; set; }
    public string? Material { get; set; }
    public List<string> KeyFeatures { get; set; } = new();
    public string Tone { get; set; } = "luxury";
}

public class GeneratedProductDescriptionResponseDto
{
    public string SeoTitle { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public string CareInstructions { get; set; } = string.Empty;
    public List<string> SuggestedTags { get; set; } = new();
    public string MetaDescription { get; set; } = string.Empty;
}
