using DocumentIntelligence.API.Services.Interfaces;

namespace DocumentIntelligence.API.Models.DTOs;

public class DocumentInsightDto
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string Category { get; set; } = "General";
    public double ConfidenceScore { get; set; }
    public string ExecutiveSummary { get; set; } = string.Empty;
    public List<string> KeyHighlights { get; set; } = new();
    public Dictionary<string, string> KeyValues { get; set; } = new();
    public List<ExtractedEntityDto> Entities { get; set; } = new();
    public List<string> ActionItems { get; set; } = new();
    public string Language { get; set; } = "en";
    public string AiModelUsed { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; }
}

public class DocumentExtractedContentDto
{
    public int DocumentId { get; set; }
    public string RawText { get; set; } = string.Empty;
    public int PageCount { get; set; } = 1;
    public int WordCount { get; set; }
    public DateTime ExtractedAt { get; set; }
}

