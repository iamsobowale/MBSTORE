using MBSite.Domain.Cart;
using MBSite.Domain.Orders;
using MBSite.Domain.Promotions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MBSite.Infrastructure.Persistence.Configurations;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("carts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AnonymousToken).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => x.AnonymousToken).IsUnique();

        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(i => i.CartId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("cart_items");
        builder.HasKey(x => x.Id);
        // One row per variant within a cart (quantity is merged).
        builder.HasIndex(x => new { x.CartId, x.ProductVariantId }).IsUnique();
    }
}

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.PublicReference).HasMaxLength(20).IsRequired();
        builder.HasIndex(x => x.PublicReference).IsUnique();
        builder.Property(x => x.TrackingToken).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => x.TrackingToken).IsUnique();

        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.FirstName).HasMaxLength(120);
        builder.Property(x => x.LastName).HasMaxLength(120);
        builder.Property(x => x.Phone).HasMaxLength(40);
        builder.Property(x => x.AddressLine).HasMaxLength(500);
        builder.Property(x => x.State).HasMaxLength(120);
        builder.Property(x => x.City).HasMaxLength(120);
        builder.Property(x => x.DeliveryInstructions).HasMaxLength(1000);
        builder.Property(x => x.DiscountCode).HasMaxLength(60);
        builder.Property(x => x.Currency).HasMaxLength(3);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.HasIndex(x => x.Status);

        foreach (var money in new[] { nameof(Order.Subtotal), nameof(Order.DiscountTotal), nameof(Order.ShippingTotal), nameof(Order.GrandTotal) })
            builder.Property(money).HasPrecision(18, 2);

        builder.HasMany(x => x.Items).WithOne().HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(x => x.StatusHistory).WithOne().HasForeignKey(h => h.OrderId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("order_items");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ProductNameSnapshot).HasMaxLength(200);
        builder.Property(x => x.ColorSnapshot).HasMaxLength(60);
        builder.Property(x => x.SizeSnapshot).HasMaxLength(30);
        builder.Property(x => x.SkuSnapshot).HasMaxLength(80);
        builder.Property(x => x.ImageUrlSnapshot).HasMaxLength(2048);
        builder.Property(x => x.UnitPriceSnapshot).HasPrecision(18, 2);
        builder.Property(x => x.LineTotalSnapshot).HasPrecision(18, 2);
    }
}

public class OrderStatusHistoryConfiguration : IEntityTypeConfiguration<OrderStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderStatusHistory> builder)
    {
        builder.ToTable("order_status_history");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FromStatus).HasConversion<int?>();
        builder.Property(x => x.ToStatus).HasConversion<int>();
        builder.Property(x => x.Note).HasMaxLength(500);
    }
}

public class DiscountConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.ToTable("discounts");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Type).HasConversion<int>();
        builder.Property(x => x.Value).HasPrecision(18, 2);
        builder.Property(x => x.MinOrderAmount).HasPrecision(18, 2);
    }
}

public class DiscountUsageConfiguration : IEntityTypeConfiguration<DiscountUsage>
{
    public void Configure(EntityTypeBuilder<DiscountUsage> builder)
    {
        builder.ToTable("discount_usages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CustomerEmail).HasMaxLength(256);
        builder.Property(x => x.AmountApplied).HasPrecision(18, 2);
        builder.HasIndex(x => x.DiscountId);
    }
}
