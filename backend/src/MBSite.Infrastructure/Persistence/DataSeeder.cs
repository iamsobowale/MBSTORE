using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Catalog;
using MBSite.Domain.Identity;
using MBSite.Domain.Promotions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MBSite.Infrastructure.Persistence;

/// <summary>
/// Seeds a default admin user and a small premium activewear catalog for local
/// development. Idempotent: each part no-ops when its data already exists.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(
        AppDbContext db, IPasswordHasher hasher, IConfiguration config, CancellationToken ct = default)
    {
        await SeedAdminAsync(db, hasher, config, ct);
        await SeedCatalogAsync(db, ct);
        await SeedDiscountsAsync(db, ct);
    }

    private static async Task SeedDiscountsAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Discounts.AnyAsync(ct)) return;

        db.Discounts.AddRange(
            new Discount { Code = "WELCOME10", Type = DiscountType.Percentage, Value = 10m, IsActive = true },
            new Discount { Code = "SAVE5000", Type = DiscountType.FixedAmount, Value = 5000m, MinOrderAmount = 40000m, IsActive = true });
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedAdminAsync(
        AppDbContext db, IPasswordHasher hasher, IConfiguration config, CancellationToken ct)
    {
        if (await db.Users.AnyAsync(ct)) return;

        var email = (config["Seed:AdminEmail"] ?? "admin@mb.local").ToLowerInvariant();
        var password = config["Seed:AdminPassword"] ?? "Admin123!";

        db.Users.Add(new User
        {
            Email = email,
            PasswordHash = hasher.Hash(password),
            Role = UserRole.SuperAdmin,
            IsActive = true
        });
        await db.SaveChangesAsync(ct);
    }

    private static async Task SeedCatalogAsync(AppDbContext db, CancellationToken ct)
    {
        if (await db.Products.AnyAsync(ct)) return;

        var men = new Category { Name = "Men", Slug = "men", SortOrder = 1 };
        var women = new Category { Name = "Women", Slug = "women", SortOrder = 2 };
        var accessories = new Category { Name = "Accessories", Slug = "accessories", SortOrder = 3 };
        db.Categories.AddRange(men, women, accessories);

        var products = new[]
        {
            BuildProduct("Compression Long-Sleeve", "compression-long-sleeve",
                "Sweat-wicking second-skin compression top engineered for high-output training.",
                30000m, men, new[] { "Black", "White" }, new[] { "S", "M", "L", "XL" },
                new[] { "photo-1594381898411-846e7d193883", "photo-1571019613454-1cb2f99b2d8b" }),
            BuildProduct("Performance Joggers", "performance-joggers",
                "Tapered technical joggers with four-way stretch and zip pockets.",
                42000m, men, new[] { "Black", "Charcoal" }, new[] { "S", "M", "L", "XL" },
                new[] { "photo-1483721310020-03333e577078", "photo-1552674605-db6ffd4facb5" }),
            BuildProduct("Seamless Sports Bra", "seamless-sports-bra",
                "Medium-support seamless bra with breathable mesh paneling.",
                24000m, women, new[] { "Black", "Stone" }, new[] { "XS", "S", "M", "L" },
                new[] { "photo-1517838277536-f5f99be501cd", "photo-1518310383802-640c2de311b2" }),
            BuildProduct("High-Rise Leggings", "high-rise-leggings",
                "Squat-proof high-rise leggings with a sculpting waistband.",
                38000m, women, new[] { "Black", "Olive" }, new[] { "XS", "S", "M", "L" },
                new[] { "photo-1506629082955-511b1aa562c8", "photo-1548690312-e3b507d8c110" }),
            BuildProduct("Training Cap", "training-cap",
                "Lightweight breathable cap with moisture-wicking sweatband.",
                15000m, accessories, new[] { "Black", "White" }, new[] { "One Size" },
                new[] { "photo-1588850561407-ed78c282e89b", "photo-1521369909029-2afed882baee" }),
            BuildProduct("Everyday Gym Tee", "everyday-gym-tee",
                "Soft-touch relaxed-fit tee for training and rest days.",
                18000m, men, new[] { "Black", "White", "Grey" }, new[] { "S", "M", "L", "XL" },
                new[] { "photo-1576678927484-cc907957088c", "photo-1618354691373-d851c5c3a990" }),
        };

        // Size guides (measurement estimates) for apparel products.
        var topSizes = new[] { "S", "M", "L", "XL" };
        AddSizeGuide(products[0], "Chest", "in", topSizes, new[] { "36-38", "39-41", "42-44", "45-47" });
        AddSizeGuide(products[0], "Length", "in", topSizes, new[] { "27", "28", "29", "30" });

        AddSizeGuide(products[1], "Waist", "in", topSizes, new[] { "28-30", "31-33", "34-36", "37-39" });
        AddSizeGuide(products[1], "Inseam", "in", topSizes, new[] { "30", "31", "31", "32" });

        var womenSizes = new[] { "XS", "S", "M", "L" };
        AddSizeGuide(products[2], "Underbust", "in", womenSizes, new[] { "26-28", "28-30", "31-33", "34-36" });

        AddSizeGuide(products[3], "Waist", "in", womenSizes, new[] { "24-25", "26-27", "28-30", "31-33" });
        AddSizeGuide(products[3], "Hips", "in", womenSizes, new[] { "34-35", "36-37", "38-40", "41-43" });
        AddSizeGuide(products[3], "Inseam", "in", womenSizes, new[] { "27", "27", "28", "28" });

        AddSizeGuide(products[5], "Chest", "in", topSizes, new[] { "36-38", "39-41", "42-44", "45-47" });

        db.Products.AddRange(products);
        await db.SaveChangesAsync(ct);
    }

    private static void AddSizeGuide(Product product, string dimension, string unit, string[] sizes, string[] values)
    {
        for (var i = 0; i < sizes.Length && i < values.Length; i++)
        {
            product.SizeGuide.Add(new SizeMeasurement
            {
                Size = sizes[i],
                Dimension = dimension,
                Value = values[i],
                Unit = unit,
                SortOrder = product.SizeGuide.Count
            });
        }
    }

    private static Product BuildProduct(
        string name, string slug, string description, decimal price,
        Category category, string[] colors, string[] sizes, string[] imageIds)
    {
        var product = new Product
        {
            Name = name,
            Slug = slug,
            Description = description,
            BasePrice = price,
            Status = ProductStatus.Published,
            Categories = { category }
        };

        var order = 0;
        foreach (var imageId in imageIds)
        {
            product.Images.Add(new ProductImage
            {
                // Athletic product photography from Unsplash's image CDN.
                Url = $"https://images.unsplash.com/{imageId}?auto=format&fit=crop&w=800&h=1000&q=80",
                AltText = name,
                SortOrder = order,
                IsPrimary = order == 0
            });
            order++;
        }

        foreach (var color in colors)
        {
            foreach (var size in sizes)
            {
                // Deterministic but varied stock; some variants intentionally sold out
                // to exercise availability handling on the storefront.
                var stock = (color.Length + size.Length) % 4 == 0 ? 0 : ((color.Length * 3 + size.Length) % 12) + 1;
                product.Variants.Add(new ProductVariant
                {
                    Color = color,
                    Size = size,
                    Sku = $"{slug}-{color[..Math.Min(3, color.Length)]}-{size}".ToUpperInvariant().Replace(" ", ""),
                    StockQuantity = stock,
                    IsActive = true
                });
            }
        }

        return product;
    }
}
