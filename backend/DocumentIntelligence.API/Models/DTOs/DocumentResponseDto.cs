using DocumentIntelligence.API.Models.Entities;

namespace DocumentIntelligence.API.Models.DTOs;

public class DocumentResponseDto
{
    public int Id { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSizeBytes { get; set; }

    public DocumentProcessingStatus ProcessingStatus { get; set; }

    public DateTime UploadedAt { get; set; }

    public int UploadedByUserId { get; set; }
}
