using MBSite.Application.Checkout;
using MBSite.Application.Common;
using MBSite.Application.Cart;
using MBSite.Application.Customers;
using MBSite.Application.Notifications;
using MBSite.Domain.Catalog;
using MBSite.Domain.Orders;
using MBSite.Domain.Promotions;
using MBSite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace MBSite.Tests;

public class CheckoutServiceTests
{
    private static AppDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name).Options);

    private static readonly IOrderEventPublisher NoEvents = new NoOpEventPublisher();
    private static readonly IAdminCustomerService NoCustomers = new NoOpCustomerService();

    private sealed class NoOpEventPublisher : IOrderEventPublisher
    {
        public Task PublishStatusChangedAsync(OrderStatusChanged evt, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private sealed class NoOpCustomerService : IAdminCustomerService
    {
        public Task<PagedResult<AdminCustomerListItem>> ListAsync(int page, int pageSize, string? search, CancellationToken ct = default)
            => Task.FromResult(new PagedResult<AdminCustomerListItem>([], 1, 20, 0));
        public Task<AdminCustomerDetail> GetAsync(Guid id, CancellationToken ct = default)
            => throw new NotImplementedException();
        public Task UpsertFromOrderAsync(Order order, CancellationToken ct = default)
            => Task.CompletedTask;
    }

    private static async Task<(string cartToken, Guid variantId)> SeedProductAndCart(
        AppDbContext db, int stock = 10, decimal price = 10000m)
    {
        var product = new Product { Name = "Tee", Slug = "tee", BasePrice = price, Status = ProductStatus.Published };
        var variant = new ProductVariant { Color = "Black", Size = "M", Sku = "TEE-M", StockQuantity = stock, IsActive = true };
        product.Variants.Add(variant);
        db.Products.Add(product);

        var cart = new MBSite.Domain.Cart.Cart { AnonymousToken = "cart-token" };
        cart.Items.Add(new MBSite.Domain.Cart.CartItem { ProductVariantId = variant.Id, Quantity = 2 });
        db.Carts.Add(cart);
        await db.SaveChangesAsync();
        return (cart.AnonymousToken, variant.Id);
    }

    private static CheckoutRequest Request(string token, string? code = null) =>
        new(token, "Ada", "Obi", "ada@example.com", "08000000000", "1 Main St", "Lagos", "Ikeja", null, code);

    [Fact]
    public async Task PlaceOrder_CreatesPendingOrder_WithServerComputedTotals()
    {
        var dbName = Guid.NewGuid().ToString();
        string token;
        using (var db = NewDb(dbName)) (token, _) = await SeedProductAndCart(db);

        using (var db = NewDb(dbName))
        {
            var svc = new CheckoutService(db, new DiscountService(db), NoEvents, NoCustomers);
            var order = await svc.PlaceOrderAsync(Request(token));

            Assert.Equal("PendingPayment", order.Status);
            Assert.Equal(20000m, order.Subtotal);          // 2 x 10,000
            Assert.Equal(2500m, order.ShippingTotal);       // flat (under free threshold)
            Assert.Equal(22500m, order.GrandTotal);
            Assert.StartsWith("MB-", order.PublicReference);
            Assert.False(string.IsNullOrEmpty(order.TrackingToken));
            Assert.Single(order.Items);
        }
    }

    [Fact]
    public async Task PlaceOrder_Fails_WhenStockInsufficient()
    {
        var dbName = Guid.NewGuid().ToString();
        string token;
        using (var db = NewDb(dbName)) (token, _) = await SeedProductAndCart(db, stock: 1); // cart wants 2

        using (var db = NewDb(dbName))
        {
            var svc = new CheckoutService(db, new DiscountService(db), NoEvents, NoCustomers);
            await Assert.ThrowsAsync<ValidationException>(() => svc.PlaceOrderAsync(Request(token)));
        }
    }

    [Fact]
    public async Task PlaceOrder_AppliesPercentageDiscount_AndRecordsUsage()
    {
        var dbName = Guid.NewGuid().ToString();
        string token;
        using (var db = NewDb(dbName))
        {
            (token, _) = await SeedProductAndCart(db);
            db.Discounts.Add(new Discount { Code = "WELCOME10", Type = DiscountType.Percentage, Value = 10m, IsActive = true });
            await db.SaveChangesAsync();
        }

        using (var db = NewDb(dbName))
        {
            var svc = new CheckoutService(db, new DiscountService(db), NoEvents, NoCustomers);
            var order = await svc.PlaceOrderAsync(Request(token, "WELCOME10"));

            Assert.Equal(2000m, order.DiscountTotal);       // 10% of 20,000
            Assert.Equal(20500m, order.GrandTotal);          // 20,000 - 2,000 + 2,500
            Assert.Equal("WELCOME10", order.DiscountCode);
        }

        using (var db = NewDb(dbName))
        {
            Assert.Equal(1, await db.DiscountUsages.CountAsync());
            var discount = await db.Discounts.FirstAsync(d => d.Code == "WELCOME10");
            Assert.Equal(1, discount.UsageCount);
        }
    }

    [Fact]
    public async Task PlaceOrder_ClearsCart_AndOrderRetrievableByToken()
    {
        var dbName = Guid.NewGuid().ToString();
        string token;
        using (var db = NewDb(dbName)) (token, _) = await SeedProductAndCart(db);

        string trackingToken;
        using (var db = NewDb(dbName))
        {
            var order = await new CheckoutService(db, new DiscountService(db), NoEvents, NoCustomers).PlaceOrderAsync(Request(token));
            trackingToken = order.TrackingToken;
        }

        using (var db = NewDb(dbName))
        {
            Assert.Equal(0, await db.CartItems.CountAsync());
            var fetched = await new CheckoutService(db, new DiscountService(db), NoEvents, NoCustomers).GetByTokenAsync(trackingToken);
            Assert.NotNull(fetched);
            Assert.Equal("PendingPayment", fetched!.Status);
        }
    }
}
