using MBSite.Application.Common;
using MBSite.Application.Customers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/customers")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminCustomersController : ControllerBase
{
    private readonly IAdminCustomerService _svc;

    public AdminCustomersController(IAdminCustomerService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminCustomerListItem>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
        => Ok(await _svc.ListAsync(page, pageSize, search, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminCustomerDetail>> Get(Guid id, CancellationToken ct)
        => Ok(await _svc.GetAsync(id, ct));
}
