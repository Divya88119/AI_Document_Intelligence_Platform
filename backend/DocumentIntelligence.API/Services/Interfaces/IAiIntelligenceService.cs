using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public class ExtractedEntityDto
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class DocumentAnalysisResult
{
    public string Category { get; set; } = "General";
    public double ConfidenceScore { get; set; } = 0.95;
    public string ExecutiveSummary { get; set; } = string.Empty;
    public List<string> KeyHighlights { get; set; } = new();
    public Dictionary<string, string> KeyValues { get; set; } = new();
    public List<ExtractedEntityDto> Entities { get; set; } = new();
    public List<string> ActionItems { get; set; } = new();
    public string Language { get; set; } = "en";
    public string AiModelUsed { get; set; } = "BuiltIn-Intelligence";
}

public interface IAiIntelligenceService
{
    Task<DocumentAnalysisResult> AnalyzeDocumentAsync(
        string fileName,
        string rawText,
        CancellationToken cancellationToken = default);

    Task<string> AnswerQuestionAsync(
        string question,
        string documentText,
        IReadOnlyList<DocumentChatMessageDto>? chatHistory = null,
        CancellationToken cancellationToken = default);
}

