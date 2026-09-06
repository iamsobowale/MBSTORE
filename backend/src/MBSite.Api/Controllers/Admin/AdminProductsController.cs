using MBSite.Application.Catalog.Admin;
using MBSite.Application.Common;
using MBSite.Domain.Catalog;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/products")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly IAdminCatalogService _svc;

    public AdminProductsController(IAdminCatalogService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminProductListItem>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] ProductStatus? status = null,
        CancellationToken ct = default)
        => Ok(await _svc.ListProductsAsync(page, pageSize, search, status, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminProductDetail>> Get(Guid id, CancellationToken ct)
        => Ok(await _svc.GetProductAsync(id, ct));

    [HttpPost]
    public async Task<ActionResult<AdminProductDetail>> Create(UpsertProductRequest request, CancellationToken ct)
    {
        var created = await _svc.CreateProductAsync(request, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminProductDetail>> Update(Guid id, UpsertProductRequest request, CancellationToken ct)
        => Ok(await _svc.UpdateProductAsync(id, request, ct));

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        await _svc.ArchiveProductAsync(id, ct);
        return NoContent();
    }
}
