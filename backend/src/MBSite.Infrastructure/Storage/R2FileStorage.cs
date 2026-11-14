using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;

namespace MBSite.Infrastructure.Storage;

/// <summary>
/// Production file storage backed by Cloudflare R2 (S3-compatible).
/// Activated when R2:AccountId, R2:AccessKeyId, R2:SecretAccessKey, and R2:BucketName are set.
/// </summary>
public sealed class R2FileStorage : IFileStorage, IAsyncDisposable
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"
    };

    private const long MaxBytes = 5 * 1024 * 1024;

    private readonly AmazonS3Client _client;
    private readonly string _bucket;
    private readonly string _publicUrl;

    public R2FileStorage(IConfiguration config)
    {
        var accountId  = config["R2:AccountId"]!;
        var accessKey  = config["R2:AccessKeyId"]!;
        var secretKey  = config["R2:SecretAccessKey"]!;
        _bucket        = config["R2:BucketName"]!;
        // Optional custom domain; falls back to the R2 public URL pattern.
        _publicUrl     = (config["R2:PublicUrl"] ?? $"https://pub-{accountId}.r2.dev/{_bucket}").TrimEnd('/');

        var endpoint = $"https://{accountId}.r2.cloudflarestorage.com";
        var creds    = new BasicAWSCredentials(accessKey, secretKey);
        var s3Config = new AmazonS3Config
        {
            ServiceURL           = endpoint,
            ForcePathStyle       = true,
            AuthenticationRegion = "auto",
        };
        _client = new AmazonS3Client(creds, s3Config);
    }

    public async Task<string> SaveAsync(Stream content, string originalFileName, string contentType, CancellationToken ct = default)
    {
        if (!AllowedContentTypes.Contains(contentType))
            throw new ValidationException("Unsupported image type. Use JPEG, PNG, WebP, AVIF, or SVG.");

        if (content.CanSeek && content.Length > MaxBytes)
            throw new ValidationException("Image exceeds the 5 MB limit.");

        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrWhiteSpace(ext))
            ext = contentType.ToLowerInvariant() switch
            {
                "image/png"     => ".png",
                "image/webp"    => ".webp",
                "image/avif"    => ".avif",
                "image/svg+xml" => ".svg",
                _               => ".jpg",
            };

        var key = $"uploads/{Guid.NewGuid():N}{ext.ToLowerInvariant()}";

        var request = new PutObjectRequest
        {
            BucketName            = _bucket,
            Key                   = key,
            InputStream           = content,
            ContentType           = contentType,
            CannedACL             = S3CannedACL.PublicRead,
            DisablePayloadSigning = true,
        };

        await _client.PutObjectAsync(request, ct);

        return $"{_publicUrl}/{key}";
    }

    public ValueTask DisposeAsync()
    {
        _client.Dispose();
        return ValueTask.CompletedTask;
    }
}
