using MBSite.Application.Cart;
using MBSite.Application.Catalog;
using MBSite.Application.Catalog.Admin;
using MBSite.Application.Checkout;
using MBSite.Application.Customers;
using MBSite.Application.Dashboard;
using MBSite.Application.Discounts;
using MBSite.Application.Identity;
using MBSite.Application.Notifications;
using MBSite.Application.Orders;
using MBSite.Application.Payments;
using MBSite.Application.StoreConfiguration;
using Microsoft.Extensions.DependencyInjection;

namespace MBSite.Application;

public static class DependencyInjection
{
    /// <summary>Registers application-layer services (use cases).</summary>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IStoreSettingsService, StoreSettingsService>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IAdminCatalogService, AdminCatalogService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IDiscountService, DiscountService>();
        services.AddScoped<ICheckoutService, CheckoutService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IAdminOrderService, AdminOrderService>();
        services.AddScoped<IAdminDiscountService, AdminDiscountService>();
        services.AddScoped<IAdminCustomerService, AdminCustomerService>();
        services.AddScoped<IDashboardService, DashboardService>();

        // Event-driven notifications: publisher fans out to handlers; the enqueuer
        // handler queues emails; the dispatcher (driven by a hosted service) sends them.
        services.AddScoped<IOrderEventPublisher, OrderEventPublisher>();
        services.AddScoped<IOrderEventHandler, NotificationEnqueuer>();
        services.AddScoped<NotificationDispatcher>();
        return services;
    }
}
