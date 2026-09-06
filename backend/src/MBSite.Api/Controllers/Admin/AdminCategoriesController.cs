using MBSite.Application.Catalog;
using MBSite.Application.Catalog.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/categories")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly IAdminCatalogService _admin;
    private readonly ICatalogService _catalog;

    public AdminCategoriesController(IAdminCatalogService admin, ICatalogService catalog)
    {
        _admin = admin;
        _catalog = catalog;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> List(CancellationToken ct)
        => Ok(await _catalog.GetCategoriesAsync(ct));

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(UpsertCategoryRequest request, CancellationToken ct)
        => Ok(await _admin.CreateCategoryAsync(request, ct));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, UpsertCategoryRequest request, CancellationToken ct)
        => Ok(await _admin.UpdateCategoryAsync(id, request, ct));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _admin.DeleteCategoryAsync(id, ct);
        return NoContent();
    }
}
