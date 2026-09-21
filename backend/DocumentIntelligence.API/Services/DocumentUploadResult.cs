using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services;

public class DocumentUploadResult
{
    public bool Succeeded { get; init; }

    public string? ErrorMessage { get; init; }

    public DocumentResponseDto? Document { get; init; }

    public static DocumentUploadResult Success(DocumentResponseDto document) => new()
    {
        Succeeded = true,
        Document = document
    };

    public static DocumentUploadResult Failure(string errorMessage) => new()
    {
        Succeeded = false,
        ErrorMessage = errorMessage
    };
}
