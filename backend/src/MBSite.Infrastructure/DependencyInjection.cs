using MBSite.Application.Common.Interfaces;
using MBSite.Application.Notifications;
using MBSite.Application.Payments;
using MBSite.Infrastructure.Notifications;
using MBSite.Infrastructure.Payments;
using MBSite.Infrastructure.Persistence;
using MBSite.Infrastructure.Security;
using MBSite.Infrastructure.Storage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace MBSite.Infrastructure;

public static class DependencyInjection
{
    /// <summary>Registers infrastructure services (persistence, external providers).</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IFileStorage, LocalFileStorage>();

        // Email channel first (dev logs the message; swap for SMTP/provider in prod).
        services.AddSingleton<IEmailSender, LoggingEmailSender>();

        // Payment provider selected by config (default Fake for local dev).
        var provider = configuration["Payments:Provider"] ?? "Fake";
        if (provider.Equals("Paystack", StringComparison.OrdinalIgnoreCase))
            services.AddHttpClient<IPaymentProvider, PaystackPaymentProvider>();
        else
            services.AddScoped<IPaymentProvider, FakePaymentProvider>();

        return services;
    }
}
