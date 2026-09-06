namespace MBSite.Api.Middleware;

/// <summary>
/// Adds security headers to every response. These are defense-in-depth headers —
/// they don't change application logic but harden the surface against common
/// browser-side attacks.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var h = context.Response.Headers;
        h["X-Content-Type-Options"] = "nosniff";
        h["X-Frame-Options"] = "DENY";
        h["Referrer-Policy"] = "strict-origin-when-cross-origin";
        h["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        // Remove the server identity banner.
        h.Remove("Server");
        await _next(context);
    }
}
