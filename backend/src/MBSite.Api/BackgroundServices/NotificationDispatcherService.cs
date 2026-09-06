using MBSite.Application.Notifications;

namespace MBSite.Api.BackgroundServices;

/// <summary>
/// Periodically drains the notification queue on a background thread. Each tick runs
/// in its own DI scope (the dispatcher and its DbContext are scoped). Keeps email
/// delivery — and its retries — off the request path.
/// </summary>
public class NotificationDispatcherService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(15);

    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NotificationDispatcherService> _logger;

    public NotificationDispatcherService(IServiceScopeFactory scopeFactory, ILogger<NotificationDispatcherService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dispatcher = scope.ServiceProvider.GetRequiredService<NotificationDispatcher>();
                var sent = await dispatcher.DispatchDueAsync(stoppingToken);
                if (sent > 0)
                    _logger.LogInformation("Dispatched {Count} notification(s).", sent);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Notification dispatch tick failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
