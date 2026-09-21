using DocumentIntelligence.API.Models.Entities;

namespace DocumentIntelligence.API.Repositories.Interfaces;

public interface IDocumentRepository
{
    Task<IReadOnlyList<DocumentRecord>> GetDocumentsAsync(int? uploadedByUserId = null);

    Task<DocumentRecord?> GetDocumentByIdAsync(int id);

    Task<DocumentRecord?> GetDocumentWithDetailsAsync(int id);

    void Add(DocumentRecord document);

    void Remove(DocumentRecord document);

    Task SaveChangesAsync();

    Task<int> CountAsync(int? uploadedByUserId = null);

    Task<IReadOnlyList<DocumentRecord>> GetRecentDocumentsAsync(int count, int? uploadedByUserId = null);
}
