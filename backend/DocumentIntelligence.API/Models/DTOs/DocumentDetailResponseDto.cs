using DocumentIntelligence.API.Models.Entities;

namespace DocumentIntelligence.API.Models.DTOs;

public class DocumentDetailResponseDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public DocumentProcessingStatus ProcessingStatus { get; set; }
    public DateTime UploadedAt { get; set; }
    public int UploadedByUserId { get; set; }
    public string? UploadedByUserName { get; set; }
    public DocumentExtractedContentDto? ExtractedContent { get; set; }
    public DocumentInsightDto? Insight { get; set; }
}

public class DashboardStatsDto
{
    public int TotalDocuments { get; set; }
    public int CompletedDocuments { get; set; }
    public int ProcessingDocuments { get; set; }
    public int FailedDocuments { get; set; }
    public int TotalUsers { get; set; }
    public long TotalStorageBytes { get; set; }
    public Dictionary<string, int> CategoryDistribution { get; set; } = new();
    public IReadOnlyList<DocumentResponseDto> RecentDocuments { get; set; } = new List<DocumentResponseDto>();
}

