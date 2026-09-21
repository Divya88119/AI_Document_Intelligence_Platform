namespace DocumentIntelligence.API.Models.Entities;

public class DocumentRecord
{
    public int Id { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public string StoragePath { get; set; } = string.Empty;

    public DocumentProcessingStatus ProcessingStatus { get; set; } = DocumentProcessingStatus.Uploaded;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public int UploadedByUserId { get; set; }

    public User UploadedByUser { get; set; } = null!;

    public DocumentExtractedContent? ExtractedContent { get; set; }

    public DocumentInsight? Insight { get; set; }

    public ICollection<DocumentChatMessage> ChatMessages { get; set; } = new List<DocumentChatMessage>();
}
