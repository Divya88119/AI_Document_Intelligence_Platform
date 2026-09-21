using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DocumentIntelligence.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var isAdmin = User.IsInRole(ApplicationRoles.Admin);
        var stats = await _dashboardService.GetStatsAsync(currentUserId.Value, isAdmin);
        return Ok(stats);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

