using MBSite.Application.Common;
using MBSite.Application.Notifications;
using MBSite.Application.Orders;
using MBSite.Domain.Notifications;
using MBSite.Domain.Orders;
using MBSite.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace MBSite.Tests;

public class AdminOrderServiceTests
{
    private static AppDbContext NewDb(string name) =>
        new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(name).Options);

    // Real publisher + enqueuer so a transition also exercises the notification path.
    private static AdminOrderService NewService(AppDbContext db)
    {
        var publisher = new OrderEventPublisher(
            new IOrderEventHandler[] { new NotificationEnqueuer(db, NullLogger<NotificationEnqueuer>.Instance) },
            NullLogger<OrderEventPublisher>.Instance);
        return new AdminOrderService(db, publisher);
    }

    private static async Task<Guid> SeedPaidOrder(AppDbContext db)
    {
        var order = new Order
        {
            PublicReference = "MB-TEST01",
            TrackingToken = "tok-" + Guid.NewGuid().ToString("N"),
            Email = "ada@example.com",
            FirstName = "Ada",
            LastName = "Obi",
            Status = OrderStatus.Paid,
            Subtotal = 20000m,
            GrandTotal = 20000m,
            Currency = "NGN"
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order.Id;
    }

    [Fact]
    public async Task UpdateStatus_ValidTransition_WritesHistoryAndEnqueuesNotification()
    {
        var dbName = Guid.NewGuid().ToString();
        Guid orderId;
        using (var db = NewDb(dbName)) orderId = await SeedPaidOrder(db);

        using (var db = NewDb(dbName))
        {
            var detail = await NewService(db).UpdateStatusAsync(orderId, OrderStatus.Processing, "Packing", null);
            Assert.Equal("Processing", detail.Status);
            Assert.Contains(detail.History, h => h.ToStatus == "Processing" && h.FromStatus == "Paid");
        }

        using (var db = NewDb(dbName))
        {
            var note = await db.Notifications.SingleAsync();
            Assert.Equal($"{orderId}:Processing", note.EventKey);
            Assert.Equal(NotificationStatus.Pending, note.Status);
            Assert.Equal("order.processing", note.TemplateKey);
        }
    }

    [Fact]
    public async Task UpdateStatus_InvalidTransition_Throws()
    {
        var dbName = Guid.NewGuid().ToString();
        Guid orderId;
        using (var db = NewDb(dbName)) orderId = await SeedPaidOrder(db);

        using var db2 = NewDb(dbName);
        // Paid → Delivered is not an allowed jump.
        await Assert.ThrowsAsync<ValidationException>(
            () => NewService(db2).UpdateStatusAsync(orderId, OrderStatus.Delivered, null, null));
    }

    [Fact]
    public async Task UpdateStatus_SameStatus_IsNoOp_NoDuplicateHistoryOrNotification()
    {
        var dbName = Guid.NewGuid().ToString();
        Guid orderId;
        using (var db = NewDb(dbName)) orderId = await SeedPaidOrder(db);

        using (var db = NewDb(dbName))
            await NewService(db).UpdateStatusAsync(orderId, OrderStatus.Paid, null, null);

        using (var db = NewDb(dbName))
        {
            Assert.Equal(0, await db.OrderStatusHistory.CountAsync());
            Assert.Equal(0, await db.Notifications.CountAsync());
        }
    }

    [Fact]
    public async Task Enqueue_IsIdempotent_ForRepeatedSameStatusEvent()
    {
        var dbName = Guid.NewGuid().ToString();
        Guid orderId;
        using (var db = NewDb(dbName)) orderId = await SeedPaidOrder(db);

        using (var db = NewDb(dbName))
        {
            var enqueuer = new NotificationEnqueuer(db, NullLogger<NotificationEnqueuer>.Instance);
            var evt = new OrderStatusChanged(orderId, OrderStatus.Processing, OrderStatus.Shipped, null);
            await enqueuer.HandleAsync(evt);
            await enqueuer.HandleAsync(evt); // duplicate delivery
        }

        using (var db = NewDb(dbName))
            Assert.Equal(1, await db.Notifications.CountAsync(n => n.EventKey == $"{orderId}:Shipped"));
    }
}
