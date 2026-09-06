using System.Security.Claims;
using MBSite.Application.Common;
using MBSite.Application.Orders;
using MBSite.Domain.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/orders")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IAdminOrderService _svc;

    public AdminOrdersController(IAdminOrderService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminOrderListItem>>> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] OrderStatus? status = null,
        CancellationToken ct = default)
        => Ok(await _svc.ListAsync(page, pageSize, search, status, ct));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AdminOrderDetail>> Get(Guid id, CancellationToken ct)
        => Ok(await _svc.GetAsync(id, ct));

    [HttpPost("{id:guid}/status")]
    public async Task<ActionResult<AdminOrderDetail>> UpdateStatus(
        Guid id, UpdateOrderStatusRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var to))
            throw new ValidationException($"Unknown order status '{request.Status}'.");

        return Ok(await _svc.UpdateStatusAsync(id, to, request.Note, CurrentUserId(), ct));
    }

    private Guid? CurrentUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(id, out var guid) ? guid : null;
    }
}
