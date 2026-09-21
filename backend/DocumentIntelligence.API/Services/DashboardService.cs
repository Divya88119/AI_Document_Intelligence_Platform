using DocumentIntelligence.API.Data;
using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace DocumentIntelligence.API.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(int? currentUserId = null, bool isAdmin = false)
    {
        var docQuery = _context.Documents.AsNoTracking();
        if (!isAdmin && currentUserId.HasValue)
        {
            docQuery = docQuery.Where(d => d.UploadedByUserId == currentUserId.Value);
        }

        var totalDocs = await docQuery.CountAsync();
        var completedDocs = await docQuery.CountAsync(d => d.ProcessingStatus == DocumentProcessingStatus.Completed);
        var processingDocs = await docQuery.CountAsync(d => d.ProcessingStatus == DocumentProcessingStatus.Processing || d.ProcessingStatus == DocumentProcessingStatus.Queued || d.ProcessingStatus == DocumentProcessingStatus.Uploaded);
        var failedDocs = await docQuery.CountAsync(d => d.ProcessingStatus == DocumentProcessingStatus.Failed);
        var totalStorage = await docQuery.SumAsync(d => (long?)d.FileSizeBytes) ?? 0;

        var totalUsers = isAdmin ? await _context.Users.CountAsync(u => !u.IsDeleted) : 1;

        // Category breakdown
        var categories = await _context.DocumentInsights
            .AsNoTracking()
            .Where(i => !currentUserId.HasValue || isAdmin || i.Document.UploadedByUserId == currentUserId.Value)
            .GroupBy(i => i.Category)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count);

        // Recent documents
        var recentDocs = await docQuery
            .OrderByDescending(d => d.UploadedAt)
            .Take(6)
            .Select(d => new DocumentResponseDto
            {
                Id = d.Id,
                FileName = d.OriginalFileName,
                ContentType = d.ContentType,
                FileSizeBytes = d.FileSizeBytes,
                ProcessingStatus = d.ProcessingStatus,
                UploadedAt = d.UploadedAt,
                UploadedByUserId = d.UploadedByUserId
            })
            .ToListAsync();

        return new DashboardStatsDto
        {
            TotalDocuments = totalDocs,
            CompletedDocuments = completedDocs,
            ProcessingDocuments = processingDocs,
            FailedDocuments = failedDocs,
            TotalUsers = totalUsers,
            TotalStorageBytes = totalStorage,
            CategoryDistribution = categories,
            RecentDocuments = recentDocs
        };
    }
}

