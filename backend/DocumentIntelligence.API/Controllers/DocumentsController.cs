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
public class DocumentsController : ControllerBase
{
    private readonly IDocumentService _documentService;

    public DocumentsController(IDocumentService documentService)
    {
        _documentService = documentService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentResponseDto>>> GetDocuments()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var uploadedByUserId = User.IsInRole(ApplicationRoles.Admin)
            ? null
            : currentUserId;

        return Ok(await _documentService.GetDocumentsAsync(uploadedByUserId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentDetailResponseDto>> GetDocument(int id)
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
        var document = await _documentService.GetDocumentByIdAsync(id, currentUserId.Value, isAdmin);

        if (document is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Document not found.",
                detail: $"Document with ID {id} was not found or you don't have access.");
        }

        return Ok(document);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DocumentResponseDto>> UploadDocument(
        [FromForm] DocumentUploadRequestDto uploadRequest)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId is null)
        {
            return Problem(
                statusCode: StatusCodes.Status401Unauthorized,
                title: "Authentication failed.",
                detail: "The authenticated user ID is missing or invalid.");
        }

        var result = await _documentService.UploadAsync(uploadRequest.File, currentUserId.Value);
        if (!result.Succeeded)
        {
            return Problem(
                statusCode: StatusCodes.Status400BadRequest,
                title: "Document upload failed.",
                detail: result.ErrorMessage);
        }

        return CreatedAtAction(nameof(GetDocument), new { id = result.Document!.Id }, result.Document);
    }

    [HttpGet("{id}/download")]
    public async Task<IActionResult> DownloadDocument(int id)
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
        var fileData = await _documentService.DownloadDocumentAsync(id, currentUserId.Value, isAdmin);

        if (fileData is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "File not found.",
                detail: $"The file for document ID {id} could not be found.");
        }

        return File(fileData.Value.Bytes, fileData.Value.ContentType, fileData.Value.FileName);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDocument(int id)
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
        var deleted = await _documentService.DeleteDocumentAsync(id, currentUserId.Value, isAdmin);

        if (!deleted)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Document not found.",
                detail: $"Document with ID {id} was not found or could not be deleted.");
        }

        return NoContent();
    }

    [HttpPost("{id}/reprocess")]
    public async Task<IActionResult> ReprocessDocument(int id)
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
        var reprocessed = await _documentService.ReprocessDocumentAsync(id, currentUserId.Value, isAdmin);

        if (!reprocessed)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Document not found.",
                detail: $"Document with ID {id} was not found.");
        }

        return Accepted(new { message = "Document queued for reprocessing." });
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}
