using MBSite.Domain.Cart;
using MBSite.Domain.Catalog;
using MBSite.Domain.Customers;
using MBSite.Domain.Identity;
using MBSite.Domain.Notifications;
using MBSite.Domain.Orders;
using MBSite.Domain.Payments;
using MBSite.Domain.Promotions;
using MBSite.Domain.StoreConfiguration;
using Microsoft.EntityFrameworkCore;
using CartEntity = MBSite.Domain.Cart.Cart;

namespace MBSite.Application.Common.Interfaces;

/// <summary>
/// Abstraction over the persistence context so application services depend on a
/// contract rather than the EF Core implementation directly. New aggregates get a
/// DbSet here as the domains are built out.
/// </summary>
public interface IAppDbContext
{
    DbSet<StoreSettings> StoreSettings { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Category> Categories { get; }
    DbSet<User> Users { get; }
    DbSet<CartEntity> Carts { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<OrderStatusHistory> OrderStatusHistory { get; }
    DbSet<Discount> Discounts { get; }
    DbSet<DiscountUsage> DiscountUsages { get; }
    DbSet<Payment> Payments { get; }
    DbSet<WebhookEvent> WebhookEvents { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<Customer> Customers { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>Access to EF database facade for transactions (checkout, stock decrement).</summary>
    Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade Database { get; }
}
