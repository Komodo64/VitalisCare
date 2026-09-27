namespace CitasMedicas.Web.Controllers;

using CitasMedicas.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController, Authorize(Roles = "Admin"), Route("api/dashboard")]
public class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken) => Ok(await dashboardService.ObtenerEstadisticasAsync(cancellationToken));
}