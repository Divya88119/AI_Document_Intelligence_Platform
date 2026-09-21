namespace DocumentIntelligence.API.Services.Interfaces;

public class ExtractedDocumentContentResult
{
    public string RawText { get; set; } = string.Empty;
    public int PageCount { get; set; } = 1;
    public int WordCount { get; set; }
    public bool Succeeded { get; set; } = true;
    public string? ErrorMessage { get; set; }
}

public interface ITextExtractorService
{
    Task<ExtractedDocumentContentResult> ExtractTextAsync(string filePath, string contentType, CancellationToken cancellationToken = default);
}

