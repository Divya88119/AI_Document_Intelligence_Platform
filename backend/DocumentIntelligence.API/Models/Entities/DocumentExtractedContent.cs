namespace DocumentIntelligence.API.Models.Entities;

public class DocumentExtractedContent
{
    public int Id { get; set; }

    public int DocumentId { get; set; }

    public DocumentRecord Document { get; set; } = null!;

    public string RawText { get; set; } = string.Empty;

    public int PageCount { get; set; } = 1;

    public int WordCount { get; set; }

    public DateTime ExtractedAt { get; set; } = DateTime.UtcNow;
}

