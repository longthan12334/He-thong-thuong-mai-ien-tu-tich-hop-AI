using AutoMapper;
using Ecommerce.BLL.Interfaces;
using Ecommerce.Common.DTOs;
using Ecommerce.Common.Entities;

namespace Ecommerce.BLL.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, opt => opt.MapFrom(s => s.Category != null ? s.Category.Name : string.Empty))
            .ForMember(d => d.StockStatus, opt => opt.MapFrom(s => s.StockStatus.ToString()))
            .ForMember(d => d.GalleryUrls, opt => opt.MapFrom(s => 
                !string.IsNullOrEmpty(s.GalleryUrlsJson) 
                    ? System.Text.Json.JsonSerializer.Deserialize<List<string>>(s.GalleryUrlsJson, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>()
                    : new List<string>()));

        CreateMap<ProductVariant, ProductVariantDto>();

        CreateMap<Category, CategoryDto>()
            .ForMember(d => d.ProductCount, opt => opt.MapFrom(s => s.Products.Count));

        CreateMap<Order, OrderDto>()
            .ForMember(d => d.Status, opt => opt.MapFrom(s => s.Status.ToString()))
            .ForMember(d => d.StatusLabel, opt => opt.MapFrom(s => GetStatusLabel(s.Status)));

        CreateMap<OrderItem, OrderItemDto>();

        CreateMap<Store, StoreDto>()
            .ForMember(d => d.Services, opt => opt.MapFrom(s => ParseStringList(s.ServicesJson)))
            .ForMember(d => d.Categories, opt => opt.MapFrom(s => ParseStringList(s.CategoriesJson)));

        CreateMap<Review, ReviewDto>();
        CreateMap<CreateReviewDto, Review>();
    }

    private static List<string> ParseStringList(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw.Trim().Equals("null", StringComparison.OrdinalIgnoreCase))
            return new List<string>();

        var trimmed = raw.Trim();
        try
        {
            if (trimmed.StartsWith("["))
            {
                return System.Text.Json.JsonSerializer.Deserialize<List<string>>(trimmed, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<string>();
            }
            if (trimmed.StartsWith("\"") && trimmed.EndsWith("\""))
            {
                var unquoted = System.Text.Json.JsonSerializer.Deserialize<string>(trimmed);
                if (!string.IsNullOrWhiteSpace(unquoted))
                {
                    return unquoted.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
                }
            }
        }
        catch
        {
        }

        return trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }

    private static string GetStatusLabel(Ecommerce.Common.Enums.OrderStatus status)
    {
        return status switch
        {
            Ecommerce.Common.Enums.OrderStatus.Pending => "Chờ Xác Nhận",
            Ecommerce.Common.Enums.OrderStatus.Confirmed => "Đã Xác Nhận",
            Ecommerce.Common.Enums.OrderStatus.Processing => "Đang Chuẩn Bị Hàng",
            Ecommerce.Common.Enums.OrderStatus.Shipped => "Đang Vận Chuyển",
            Ecommerce.Common.Enums.OrderStatus.Delivered => "Giao Thành Công",
            Ecommerce.Common.Enums.OrderStatus.Cancelled => "Đã Hủy",
            _ => status.ToString()
        };
    }
}
