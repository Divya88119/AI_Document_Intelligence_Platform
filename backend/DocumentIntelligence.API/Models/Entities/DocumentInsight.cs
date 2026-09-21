namespace DocumentIntelligence.API.Models.Entities;

public class DocumentInsight
{
    public int Id { get; set; }

    public int DocumentId { get; set; }

    public DocumentRecord Document { get; set; } = null!;

    public string Category { get; set; } = "General";

    public double ConfidenceScore { get; set; } = 1.0;

    public string ExecutiveSummary { get; set; } = string.Empty;

    public string KeyHighlightsJson { get; set; } = "[]";

    public string KeyValuesJson { get; set; } = "{}";

    public string EntitiesJson { get; set; } = "[]";

    public string ActionItemsJson { get; set; } = "[]";

    public string Language { get; set; } = "en";

    public string AiModelUsed { get; set; } = "Standard-AI";

    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}

