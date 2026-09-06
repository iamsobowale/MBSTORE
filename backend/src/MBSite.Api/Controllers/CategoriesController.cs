using MBSite.Application.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
[AllowAnonymous]
public class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalog;

    public CategoriesController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> List(CancellationToken ct)
        => Ok(await _catalog.GetCategoriesAsync(ct));
}
