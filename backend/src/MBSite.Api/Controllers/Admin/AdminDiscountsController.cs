using MBSite.Application.Common;
using MBSite.Application.Discounts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/discounts")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminDiscountsController : ControllerBase
{
    private readonly IAdminDiscountService _svc;

    public AdminDiscountsController(IAdminDiscountService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminDiscountListItem>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
        => Ok(await _svc.ListAsync(page, pageSize, search, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminDiscountDetail>> Get(Guid id, CancellationToken ct)
        => Ok(await _svc.GetAsync(id, ct));

    [HttpPost]
    public async Task<ActionResult<AdminDiscountDetail>> Create(UpsertDiscountRequest req, CancellationToken ct)
    {
        var created = await _svc.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AdminDiscountDetail>> Update(Guid id, UpsertDiscountRequest req, CancellationToken ct)
        => Ok(await _svc.UpdateAsync(id, req, ct));

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        await _svc.ToggleActiveAsync(id, true, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        await _svc.ToggleActiveAsync(id, false, ct);
        return NoContent();
    }
}
