using Ecommerce.Common.Entities;
using Microsoft.EntityFrameworkCore.Storage;

namespace Ecommerce.DAL.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<User> Users { get; }
    IGenericRepository<Product> Products { get; }
    IGenericRepository<Category> Categories { get; }
    IGenericRepository<ProductVariant> ProductVariants { get; }
    IGenericRepository<Order> Orders { get; }
    IGenericRepository<OrderItem> OrderItems { get; }
    IGenericRepository<Store> Stores { get; }
    IGenericRepository<TransactionRecord> Transactions { get; }
    IGenericRepository<Review> Reviews { get; }

    Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
