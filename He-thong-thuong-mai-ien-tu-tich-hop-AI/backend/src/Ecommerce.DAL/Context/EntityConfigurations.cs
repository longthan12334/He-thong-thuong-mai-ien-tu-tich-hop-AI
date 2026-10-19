using Ecommerce.Common.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Ecommerce.DAL.Context;

/// <summary>
/// Cấu hình index và constraint cho các entity thông qua EF Core Fluent API.
/// Các index này quan trọng cho hiệu năng query — thiếu index sẽ gây full table scan.
/// </summary>

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // Index trên Slug — dùng cho GetProductBySlugAsync (thường xuyên gọi)
        // Slug đã được lưu lowercase nên không cần case-insensitive index
        builder.HasIndex(p => p.Slug)
               .IsUnique()
               .HasDatabaseName("IX_Products_Slug");

        // Index trên SellerId — dùng khi filter sản phẩm theo từng Seller
        builder.HasIndex(p => p.SellerId)
               .HasDatabaseName("IX_Products_SellerId");

        // Index kết hợp IsActive + Id — dùng cho query trang chủ (IsActive=true ORDER BY Id DESC)
        builder.HasIndex(p => new { p.IsActive, p.Id })
               .HasDatabaseName("IX_Products_IsActive_Id");

        // Index trên CategoryId — dùng khi filter theo danh mục
        builder.HasIndex(p => p.CategoryId)
               .HasDatabaseName("IX_Products_CategoryId");
    }
}

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Unique index trên Email — dùng cho login (FindByEmailAsync) — query rất thường xuyên
        builder.HasIndex(u => u.Email)
               .IsUnique()
               .HasDatabaseName("IX_Users_Email");
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        // Index trên UserId — dùng khi User/Seller xem danh sách đơn hàng của mình
        builder.HasIndex(o => o.UserId)
               .HasDatabaseName("IX_Orders_UserId");

        // Index trên CustomerEmail — dùng khi tra cứu đơn hàng theo email
        builder.HasIndex(o => o.CustomerEmail)
               .HasDatabaseName("IX_Orders_CustomerEmail");
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        // Unique index trên Slug — dùng khi filter/navigate theo category URL
        builder.HasIndex(c => c.Slug)
               .IsUnique()
               .HasDatabaseName("IX_Categories_Slug");
    }
}
