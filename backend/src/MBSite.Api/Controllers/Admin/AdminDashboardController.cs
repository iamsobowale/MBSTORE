using MBSite.Application.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MBSite.Api.Controllers.Admin;

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = "SuperAdmin,Admin")]
public class AdminDashboardController : ControllerBase
{
    private readonly IDashboardService _svc;

    public AdminDashboardController(IDashboardService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<DashboardMetrics>> Get(CancellationToken ct)
        => Ok(await _svc.GetMetricsAsync(ct));
}
