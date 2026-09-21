using DocumentIntelligence.API.Authorization;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DocumentIntelligence.API.Controllers;

[ApiController]
[Route("api/documents/{documentId}/chat")]
[Authorize]
public class DocumentChatController : ControllerBase
{
    private readonly IDocumentChatService _chatService;

    public DocumentChatController(IDocumentChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DocumentChatMessageDto>>> GetChatHistory(int documentId)
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
        var history = await _chatService.GetChatHistoryAsync(documentId, currentUserId.Value, isAdmin);
        return Ok(history);
    }

    [HttpPost]
    public async Task<ActionResult<DocumentChatMessageDto>> AskQuestion(
        int documentId,
        [FromBody] DocumentChatRequestDto request)
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
        var response = await _chatService.AskQuestionAsync(documentId, request.Message, currentUserId.Value, isAdmin);

        if (response is null)
        {
            return Problem(
                statusCode: StatusCodes.Status404NotFound,
                title: "Document not found.",
                detail: $"Document with ID {documentId} was not found or you don't have access.");
        }

        return Ok(response);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

