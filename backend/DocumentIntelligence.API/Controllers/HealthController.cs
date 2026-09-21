using Microsoft.AspNetCore.Mvc;

namespace DocumentIntelligence.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "Healthy",
            message = "Document Intelligence API is running successfully!",
            timestamp = DateTime.UtcNow
        });
    }
}