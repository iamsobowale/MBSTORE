using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using MBSite.Domain.Catalog;
using Microsoft.EntityFrameworkCore;
using CartEntity = MBSite.Domain.Cart.Cart;
using CartItemEntity = MBSite.Domain.Cart.CartItem;

namespace MBSite.Application.Cart;

public interface ICartService
{
    Task<CartDto> GetAsync(string? token, CancellationToken ct = default);
    Task<CartDto> AddItemAsync(string? token, AddCartItemRequest req, CancellationToken ct = default);
    Task<CartDto> UpdateItemAsync(string token, Guid variantId, int quantity, CancellationToken ct = default);
    Task<CartDto> RemoveItemAsync(string token, Guid variantId, CancellationToken ct = default);
}

public class CartService : ICartService
{
    private readonly IAppDbContext _db;

    public CartService(IAppDbContext db) => _db = db;

    public async Task<CartDto> GetAsync(string? token, CancellationToken ct = default)
    {
        var cart = await FindCart(token, ct);
        return cart is null ? EmptyCart(token) : await BuildDto(cart, ct);
    }

    public async Task<CartDto> AddItemAsync(string? token, AddCartItemRequest req, CancellationToken ct = default)
    {
        if (req.Quantity < 1) throw new ValidationException("Quantity must be at least 1.");

        var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == req.ProductVariantId, ct)
            ?? throw new NotFoundException("Product variant not found.");
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == variant.ProductId, ct);
        if (product is null || product.Status != ProductStatus.Published || !variant.IsActive || variant.StockQuantity <= 0)
            throw new ValidationException("This item is not available for purchase.");

        var cart = await FindCart(token, ct) ?? await CreateCart(ct);

        var item = cart.Items.FirstOrDefault(i => i.ProductVariantId == req.ProductVariantId);
        var desired = (item?.Quantity ?? 0) + req.Quantity;
        // Never let the cart hold more than is in stock.
        var capped = Math.Min(desired, variant.StockQuantity);

        if (item is null)
        {
            // Add via the DbSet so it's marked Added (client-generated GUID key would
            // otherwise be treated as Modified when added to a tracked cart).
            _db.CartItems.Add(new CartItemEntity { CartId = cart.Id, ProductVariantId = req.ProductVariantId, Quantity = capped });
        }
        else
        {
            item.Quantity = capped;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await BuildDto(cart, ct);
    }

    public async Task<CartDto> UpdateItemAsync(string token, Guid variantId, int quantity, CancellationToken ct = default)
    {
        var cart = await FindCart(token, ct) ?? throw new NotFoundException("Cart not found.");
        var item = cart.Items.FirstOrDefault(i => i.ProductVariantId == variantId);
        if (item is null) throw new NotFoundException("Item not in cart.");

        if (quantity < 1)
        {
            cart.Items.Remove(item);
        }
        else
        {
            var variant = await _db.ProductVariants.FirstOrDefaultAsync(v => v.Id == variantId, ct);
            var max = variant?.StockQuantity ?? 0;
            item.Quantity = Math.Min(quantity, Math.Max(max, 1));
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return await BuildDto(cart, ct);
    }

    public async Task<CartDto> RemoveItemAsync(string token, Guid variantId, CancellationToken ct = default)
    {
        var cart = await FindCart(token, ct) ?? throw new NotFoundException("Cart not found.");
        var item = cart.Items.FirstOrDefault(i => i.ProductVariantId == variantId);
        if (item is not null)
        {
            cart.Items.Remove(item);
            cart.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return await BuildDto(cart, ct);
    }

    private Task<CartEntity?> FindCart(string? token, CancellationToken ct) =>
        string.IsNullOrWhiteSpace(token)
            ? Task.FromResult<CartEntity?>(null)
            : _db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.AnonymousToken == token, ct);

    private async Task<CartEntity> CreateCart(CancellationToken ct)
    {
        var cart = new CartEntity
        {
            AnonymousToken = TokenGenerator.UrlSafe(24),
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };
        _db.Carts.Add(cart);
        await _db.SaveChangesAsync(ct);
        return cart;
    }

    private static CartDto EmptyCart(string? token) =>
        new(token ?? string.Empty, Array.Empty<CartItemDto>(), 0m, 0, "NGN");

    private async Task<CartDto> BuildDto(CartEntity cart, CancellationToken ct)
    {
        // Read items fresh so newly added rows are always reflected, regardless of
        // the tracked collection state.
        var cartItems = await _db.CartItems.Where(i => i.CartId == cart.Id).ToListAsync(ct);
        var variantIds = cartItems.Select(i => i.ProductVariantId).ToList();
        var variants = await _db.ProductVariants.AsNoTracking()
            .Where(v => variantIds.Contains(v.Id)).ToListAsync(ct);
        var productIds = variants.Select(v => v.ProductId).Distinct().ToList();
        var products = await _db.Products.AsNoTracking()
            .Where(p => productIds.Contains(p.Id)).Include(p => p.Images).ToListAsync(ct);
        var productMap = products.ToDictionary(p => p.Id);

        var items = new List<CartItemDto>();
        decimal subtotal = 0m;

        foreach (var ci in cartItems)
        {
            var variant = variants.FirstOrDefault(v => v.Id == ci.ProductVariantId);
            var product = variant is not null && productMap.TryGetValue(variant.ProductId, out var p) ? p : null;

            if (variant is null || product is null)
            {
                items.Add(new CartItemDto(ci.ProductVariantId, Guid.Empty, "(removed)", "", "", "",
                    0m, ci.Quantity, 0m, null, false, 0, "This item is no longer available."));
                continue;
            }

            var unitPrice = variant.Price ?? product.BasePrice;
            var lineTotal = unitPrice * ci.Quantity;
            var purchasable = product.Status == ProductStatus.Published && variant.IsActive && variant.StockQuantity > 0;
            var availableQty = purchasable ? variant.StockQuantity : 0;

            string? issue = null;
            var available = true;
            if (!purchasable) { available = false; issue = "No longer available."; }
            else if (ci.Quantity > variant.StockQuantity) { available = false; issue = $"Only {variant.StockQuantity} left."; }

            if (available) subtotal += lineTotal;

            var image = product.Images.FirstOrDefault(i => i.IsPrimary) ?? product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
            items.Add(new CartItemDto(
                variant.Id, product.Id, product.Name, product.Slug, variant.Color, variant.Size,
                unitPrice, ci.Quantity, lineTotal, image?.Url, available, availableQty, issue));
        }

        return new CartDto(cart.AnonymousToken, items, subtotal, items.Sum(i => i.Quantity), "NGN");
    }
}
