namespace MBSite.Application.Notifications;

/// <summary>A rendered email ready to be delivered by an <see cref="IEmailSender"/>.</summary>
public record EmailMessage(string To, string Subject, string HtmlBody, string TextBody);

/// <summary>
/// The email delivery channel. The first (dev) implementation logs the message; a
/// real SMTP/provider sender slots in here without touching notification logic —
/// this is the "email channel first, extensible later" seam.
/// </summary>
public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken ct = default);
}
