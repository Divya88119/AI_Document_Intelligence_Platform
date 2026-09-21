using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public interface IDocumentService
{
    Task<IReadOnlyList<DocumentResponseDto>> GetDocumentsAsync(int? uploadedByUserId = null);

    Task<DocumentDetailResponseDto?> GetDocumentByIdAsync(int id, int? currentUserId = null, bool isAdmin = false);

    Task<DocumentUploadResult> UploadAsync(IFormFile file, int uploadedByUserId);

    Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(int id, int? currentUserId = null, bool isAdmin = false);

    Task<bool> DeleteDocumentAsync(int id, int? currentUserId = null, bool isAdmin = false);

    Task<bool> ReprocessDocumentAsync(int id, int? currentUserId = null, bool isAdmin = false);
}
