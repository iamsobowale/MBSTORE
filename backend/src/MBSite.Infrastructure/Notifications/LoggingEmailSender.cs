using MBSite.Application.Notifications;
using Microsoft.Extensions.Logging;

namespace MBSite.Infrastructure.Notifications;

/// <summary>
/// Development email sender: writes the rendered message to the log instead of
/// contacting a mail provider (no SMTP credentials needed for local dev). Swap this
/// registration for an SMTP/provider implementation of <see cref="IEmailSender"/>
/// in production — nothing else changes.
/// </summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger) => _logger = logger;

    public Task SendAsync(EmailMessage message, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "EMAIL → {To} | {Subject}\n{Body}",
            message.To, message.Subject, message.TextBody);
        return Task.CompletedTask;
    }
}
