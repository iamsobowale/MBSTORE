using MBSite.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MBSite.Infrastructure.Persistence.Configurations;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("products");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(220).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.Property(x => x.Description).HasMaxLength(4000);
        builder.Property(x => x.BasePrice).HasPrecision(18, 2);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.HasIndex(x => x.Status);

        builder.HasMany(x => x.Variants)
            .WithOne()
            .HasForeignKey(v => v.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Images)
            .WithOne()
            .HasForeignKey(i => i.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Categories)
            .WithMany(c => c.Products)
            .UsingEntity(join => join.ToTable("product_categories"));

        // Size guide stored as a JSON column (owned collection) — flexible dimensions.
        builder.OwnsMany(x => x.SizeGuide, nav => nav.ToJson());
    }
}

public class ProductVariantConfiguration : IEntityTypeConfiguration<ProductVariant>
{
    public void Configure(EntityTypeBuilder<ProductVariant> builder)
    {
        builder.ToTable("product_variants");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Color).HasMaxLength(60).IsRequired();
        builder.Property(x => x.Size).HasMaxLength(30).IsRequired();
        builder.Property(x => x.Sku).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => x.Sku).IsUnique();
        builder.Property(x => x.Price).HasPrecision(18, 2);

        // One row per color/size within a product.
        builder.HasIndex(x => new { x.ProductId, x.Color, x.Size }).IsUnique();

        // NOTE: Overselling under concurrent checkouts is prevented in the Inventory
        // phase via an atomic conditional decrement (UPDATE ... WHERE StockQuantity >= qty)
        // inside a transaction — more robust for stock than an optimistic token.
    }
}

public class ProductImageConfiguration : IEntityTypeConfiguration<ProductImage>
{
    public void Configure(EntityTypeBuilder<ProductImage> builder)
    {
        builder.ToTable("product_images");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Url).HasMaxLength(2048).IsRequired();
        builder.Property(x => x.AltText).HasMaxLength(300);
    }
}

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("categories");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(140).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();
    }
}
