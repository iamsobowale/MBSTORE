namespace MBSite.Application.Common.Interfaces;

/// <summary>
/// Abstraction over blob/file storage so the app isn't coupled to local disk. Swap
/// for S3/Azure Blob later without touching callers.
/// </summary>
public interface IFileStorage
{
    /// <summary>Persists an uploaded file and returns its public URL.</summary>
    Task<string> SaveAsync(Stream content, string originalFileName, string contentType, CancellationToken ct = default);
}
