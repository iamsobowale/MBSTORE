using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace MBSite.Infrastructure.Storage;

/// <summary>
/// Dev file storage: writes uploads under the web root and returns an absolute URL.
/// Validates content type + size to reject invalid image uploads.
/// </summary>
public class LocalFileStorage : IFileStorage
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"
    };

    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

    private readonly string _localPath;
    private readonly string? _configuredBaseUrl;
    private readonly IHttpContextAccessor _http;

    public LocalFileStorage(IConfiguration config, IHttpContextAccessor http)
    {
        _localPath = config["Storage:LocalPath"] ?? Path.Combine("wwwroot", "uploads");
        // Only treat the config value as authoritative if it was explicitly set
        // (the default localhost placeholder is ignored in favour of the request host).
        var configured = config["Storage:PublicBaseUrl"];
        _configuredBaseUrl = string.IsNullOrWhiteSpace(configured) ? null : configured.TrimEnd('/');
        _http = http;
    }

    public async Task<string> SaveAsync(Stream content, string originalFileName, string contentType, CancellationToken ct = default)
    {
        if (!AllowedContentTypes.Contains(contentType))
            throw new ValidationException("Unsupported image type. Use JPEG, PNG, WebP, or AVIF.");

        if (content.CanSeek && content.Length > MaxBytes)
            throw new ValidationException("Image exceeds the 5 MB limit.");

        Directory.CreateDirectory(_localPath);

        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = contentType.ToLowerInvariant() switch
            {
                "image/png" => ".png",
                "image/webp" => ".webp",
                "image/avif" => ".avif",
                "image/svg+xml" => ".svg",
                _ => ".jpg",
            };

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(_localPath, fileName);

        await using (var file = File.Create(fullPath))
        {
            await content.CopyToAsync(file, ct);
        }

        return $"{ResolveBaseUrl()}/uploads/{fileName}";
    }

    /// <summary>
    /// Builds the absolute base URL for served uploads. Prefers the live request
    /// host (works across any deployment without config), falling back to the
    /// configured value for non-HTTP contexts (e.g. background jobs).
    /// </summary>
    private string ResolveBaseUrl()
    {
        var request = _http.HttpContext?.Request;
        if (request is not null)
            return $"{request.Scheme}://{request.Host}".TrimEnd('/');

        return _configuredBaseUrl ?? "http://localhost:5159";
    }
}
