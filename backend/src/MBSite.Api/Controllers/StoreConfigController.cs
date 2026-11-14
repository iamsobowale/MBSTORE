using MBSite.Application.StoreConfiguration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/store-config")]
public class StoreConfigController : ControllerBase
{
    private readonly IStoreSettingsService _service;

    public StoreConfigController(IStoreSettingsService service) => _service = service;

    /// <summary>Public: store branding + theme for the storefront theming system.</summary>
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, VaryByHeader = "Accept")]
    public async Task<ActionResult<StoreSettingsDto>> Get(CancellationToken ct)
        => Ok(await _service.GetAsync(ct));

    /// <summary>Admin: update store branding + theme.</summary>
    [HttpPut]
    [Authorize(Roles = "SuperAdmin,Admin")]
    public async Task<ActionResult<StoreSettingsDto>> Update(UpdateStoreSettingsRequest request, CancellationToken ct)
        => Ok(await _service.UpdateAsync(request, ct));
}
