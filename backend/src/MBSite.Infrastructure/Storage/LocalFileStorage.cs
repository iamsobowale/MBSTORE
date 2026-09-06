using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
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
        "image/jpeg", "image/png", "image/webp", "image/avif"
    };

    private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

    private readonly string _localPath;
    private readonly string _publicBaseUrl;

    public LocalFileStorage(IConfiguration config)
    {
        _localPath = config["Storage:LocalPath"] ?? Path.Combine("wwwroot", "uploads");
        _publicBaseUrl = (config["Storage:PublicBaseUrl"] ?? "http://localhost:5159").TrimEnd('/');
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
            ext = contentType.Equals("image/png", StringComparison.OrdinalIgnoreCase) ? ".png" : ".jpg";

        var fileName = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(_localPath, fileName);

        await using (var file = File.Create(fullPath))
        {
            await content.CopyToAsync(file, ct);
        }

        return $"{_publicBaseUrl}/uploads/{fileName}";
    }
}
