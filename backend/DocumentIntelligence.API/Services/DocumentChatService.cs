using DocumentIntelligence.API.Data;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Services;

public class DocumentChatService : IDocumentChatService
{
    private readonly ApplicationDbContext _context;
    private readonly IAiIntelligenceService _aiService;
    private readonly ILogger<DocumentChatService> _logger;

    public DocumentChatService(
        ApplicationDbContext context,
        IAiIntelligenceService aiService,
        ILogger<DocumentChatService> logger)
    {
        _context = context;
        _aiService = aiService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DocumentChatMessageDto>> GetChatHistoryAsync(
        int documentId,
        int currentUserId,
        bool isAdmin = false)
    {
        var document = await _context.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null) return Array.Empty<DocumentChatMessageDto>();

        if (!isAdmin && document.UploadedByUserId != currentUserId)
        {
            return Array.Empty<DocumentChatMessageDto>();
        }

        var messages = await _context.DocumentChatMessages
            .AsNoTracking()
            .Include(m => m.User)
            .Where(m => m.DocumentId == documentId)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();

        return messages.Select(m => new DocumentChatMessageDto
        {
            Id = m.Id,
            DocumentId = m.DocumentId,
            UserId = m.UserId,
            UserName = m.User?.FullName ?? "User",
            Role = m.Role,
            Message = m.Message,
            Timestamp = m.Timestamp
        }).ToList();
    }

    public async Task<DocumentChatMessageDto?> AskQuestionAsync(
        int documentId,
        string question,
        int currentUserId,
        bool isAdmin = false)
    {
        var document = await _context.Documents
            .Include(d => d.ExtractedContent)
            .Include(d => d.Insight)
            .FirstOrDefaultAsync(d => d.Id == documentId);

        if (document == null) return null;

        if (!isAdmin && document.UploadedByUserId != currentUserId)
        {
            return null;
        }

        var currentUser = await _context.Users.FindAsync(currentUserId);
        var userName = currentUser?.FullName ?? "User";

        // Save User question
        var userMessage = new DocumentChatMessage
        {
            DocumentId = documentId,
            UserId = currentUserId,
            Role = "user",
            Message = question,
            Timestamp = DateTime.UtcNow
        };
        _context.DocumentChatMessages.Add(userMessage);
        await _context.SaveChangesAsync();

        // Get past chat history for context (latest 8 messages)
        var recentMessages = await _context.DocumentChatMessages
            .AsNoTracking()
            .Where(m => m.DocumentId == documentId)
            .OrderByDescending(m => m.Timestamp)
            .Take(8)
            .Select(m => new DocumentChatMessageDto
            {
                Id = m.Id,
                DocumentId = m.DocumentId,
                UserId = m.UserId,
                UserName = m.Role == "user" ? userName : "AI Assistant",
                Role = m.Role,
                Message = m.Message,
                Timestamp = m.Timestamp
            })
            .ToListAsync();

        var history = recentMessages.OrderBy(m => m.Timestamp).ToList();

        // Call AI service to answer
        var documentText = document.ExtractedContent?.RawText;
        if (string.IsNullOrWhiteSpace(documentText) && document.Insight != null)
        {
            var sb = new System.Text.StringBuilder();
            if (!string.IsNullOrWhiteSpace(document.Insight.ExecutiveSummary))
                sb.AppendLine($"Summary: {document.Insight.ExecutiveSummary}");
            if (!string.IsNullOrWhiteSpace(document.Insight.KeyHighlightsJson))
                sb.AppendLine($"Highlights: {document.Insight.KeyHighlightsJson}");
            if (!string.IsNullOrWhiteSpace(document.Insight.KeyValuesJson))
                sb.AppendLine($"Key Values: {document.Insight.KeyValuesJson}");
            if (!string.IsNullOrWhiteSpace(document.Insight.EntitiesJson))
                sb.AppendLine($"Entities: {document.Insight.EntitiesJson}");
            if (!string.IsNullOrWhiteSpace(document.Insight.ActionItemsJson))
                sb.AppendLine($"Action Items: {document.Insight.ActionItemsJson}");
            documentText = sb.ToString();
        }

        var answer = await _aiService.AnswerQuestionAsync(question, documentText ?? string.Empty, history);

        // Save Assistant response
        var assistantMessage = new DocumentChatMessage
        {
            DocumentId = documentId,
            UserId = currentUserId,
            Role = "assistant",
            Message = answer,
            Timestamp = DateTime.UtcNow
        };
        _context.DocumentChatMessages.Add(assistantMessage);
        await _context.SaveChangesAsync();

        return new DocumentChatMessageDto
        {
            Id = assistantMessage.Id,
            DocumentId = documentId,
            UserId = currentUserId,
            UserName = "AI Assistant",
            Role = "assistant",
            Message = answer,
            Timestamp = assistantMessage.Timestamp
        };
    }
}

