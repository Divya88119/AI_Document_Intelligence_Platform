using DocumentIntelligence.API.Data;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly ApplicationDbContext _context;

    public DocumentRepository(ApplicationDbContext context) => _context = context;

    public async Task<IReadOnlyList<DocumentRecord>> GetDocumentsAsync(int? uploadedByUserId = null)
    {
        var query = _context.Documents.AsNoTracking();

        if (uploadedByUserId.HasValue)
        {
            query = query.Where(document => document.UploadedByUserId == uploadedByUserId.Value);
        }

        return await query
            .OrderByDescending(document => document.UploadedAt)
            .ToListAsync();
    }

    public async Task<DocumentRecord?> GetDocumentByIdAsync(int id)
    {
        return await _context.Documents
            .FirstOrDefaultAsync(document => document.Id == id);
    }

    public async Task<DocumentRecord?> GetDocumentWithDetailsAsync(int id)
    {
        return await _context.Documents
            .Include(document => document.UploadedByUser)
            .Include(document => document.ExtractedContent)
            .Include(document => document.Insight)
            .FirstOrDefaultAsync(document => document.Id == id);
    }

    public void Add(DocumentRecord document) => _context.Documents.Add(document);

    public void Remove(DocumentRecord document) => _context.Documents.Remove(document);

    public Task SaveChangesAsync() => _context.SaveChangesAsync();

    public async Task<int> CountAsync(int? uploadedByUserId = null)
    {
        var query = _context.Documents.AsQueryable();
        if (uploadedByUserId.HasValue)
        {
            query = query.Where(document => document.UploadedByUserId == uploadedByUserId.Value);
        }
        return await query.CountAsync();
    }

    public async Task<IReadOnlyList<DocumentRecord>> GetRecentDocumentsAsync(int count, int? uploadedByUserId = null)
    {
        var query = _context.Documents.AsNoTracking();
        if (uploadedByUserId.HasValue)
        {
            query = query.Where(document => document.UploadedByUserId == uploadedByUserId.Value);
        }

        return await query
            .OrderByDescending(document => document.UploadedAt)
            .Take(count)
            .ToListAsync();
    }
}
