using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text;

namespace DocumentIntelligence.API.Controllers;

[ApiController]
[Route("api/analysis")]
[Route("api/[controller]")]
[Authorize]
public class DataAnalysisController : ControllerBase
{
    private readonly IDataAnalysisService _analysisService;

    public DataAnalysisController(IDataAnalysisService analysisService)
    {
        _analysisService = analysisService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DataAnalysisSummaryDto>>> GetReports()
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
        var reports = await _analysisService.GetReportsAsync(currentUserId.Value, isAdmin);
        return Ok(reports);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DataAnalysisReportResponseDto>> GetReport(int id)
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
        var report = await _analysisService.GetReportByIdAsync(id, currentUserId.Value, isAdmin);

        if (report is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Analysis report not found.",
                detail: $"Analysis report with ID {id} was not found.");
        }

        return Ok(report);
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DataAnalysisReportResponseDto>> AnalyzeFile(
        [FromForm] DocumentUploadRequestDto request)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        if (request.File == null || request.File.Length == 0)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "No file provided.",
                detail: "Please provide a valid CSV, Excel, or tabular file for data analysis.");
        }

        var result = await _analysisService.AnalyzeFileAsync(request.File, currentUserId.Value);
        return CreatedAtAction(nameof(GetReport), new { id = result.Id }, result);
    }

    [HttpPost("document/{documentId}")]
    public async Task<ActionResult<DataAnalysisReportResponseDto>> AnalyzeDocument(int documentId)
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
        var result = await _analysisService.AnalyzeDocumentAsync(documentId, currentUserId.Value, isAdmin);
        return CreatedAtAction(nameof(GetReport), new { id = result.Id }, result);
    }

    [HttpPost("{id}/dynamic-chart")]
    public async Task<ActionResult<DynamicChartResultDto>> GenerateDynamicChart(
        int id,
        [FromBody] DynamicChartRequestDto request)
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
        var result = await _analysisService.GenerateDynamicChartAsync(id, request, currentUserId.Value, isAdmin);
        return Ok(result);
    }

    [HttpGet("{id}/export-cleaned")]
    public async Task<IActionResult> ExportCleanedCsv(int id)
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
        var csv = await _analysisService.GetCleanedCsvAsync(id, currentUserId.Value, isAdmin);

        if (string.IsNullOrWhiteSpace(csv))
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Cleaned data not available.",
                detail: $"Cleaned CSV dataset for report {id} could not be retrieved.");
        }

        var bytes = Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", $"Cleaned_Dataset_Report_{id}.csv");
    }

    [HttpGet("{id}/versions/{version}/export")]
    public async Task<IActionResult> ExportVersionCsv(int id, string version)
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
        var csv = await _analysisService.GetVersionCsvAsync(id, version, currentUserId.Value, isAdmin);

        if (string.IsNullOrWhiteSpace(csv))
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Version data not available.",
                detail: $"CSV dataset for version {version} in report {id} could not be retrieved.");
        }

        var bytes = Encoding.UTF8.GetBytes(csv);
        return File(bytes, "text/csv", $"{version}_Dataset_Report_{id}.csv");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReport(int id)
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
        var deleted = await _analysisService.DeleteReportAsync(id, currentUserId.Value, isAdmin);

        if (!deleted)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Report not found.",
                detail: $"Analysis report {id} was not found or could not be deleted.");
        }

        return NoContent();
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
