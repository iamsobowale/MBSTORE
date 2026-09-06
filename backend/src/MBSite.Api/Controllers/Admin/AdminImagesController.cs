using MBSite.Application.Common;
using MBSite.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/images")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminImagesController : ControllerBase
{
    private readonly IFileStorage _storage;

    public AdminImagesController(IFileStorage storage) => _storage = storage;

    public record UploadResponse(string Url);

    /// <summary>Uploads an image (multipart/form-data, field name "file"); returns its URL.</summary>
    [HttpPost]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<ActionResult<UploadResponse>> Upload(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new ValidationException("No file was uploaded.");

        await using var stream = file.OpenReadStream();
        var url = await _storage.SaveAsync(stream, file.FileName, file.ContentType, ct);
        return Ok(new UploadResponse(url));
    }
}
