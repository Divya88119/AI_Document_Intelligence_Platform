using DocumentIntelligence.API.Models.DTOs;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Repositories.Interfaces;
using DocumentIntelligence.API.Services.Interfaces;
using System.Text.Json;

namespace DocumentIntelligence.API.Services;

public class DocumentService : IDocumentService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".docx", ".xlsx", ".txt", ".csv", ".json"
    };

    private const long DefaultMaxFileSizeBytes = 15 * 1024 * 1024;

    private readonly IDocumentRepository _documentRepository;
    private readonly IDocumentProcessingQueue _processingQueue;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DocumentService> _logger;

    public DocumentService(
        IDocumentRepository documentRepository,
        IDocumentProcessingQueue processingQueue,
        IWebHostEnvironment environment,
        IConfiguration configuration,
        ILogger<DocumentService> logger)
    {
        _documentRepository = documentRepository;
        _processingQueue = processingQueue;
        _environment = environment;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IReadOnlyList<DocumentResponseDto>> GetDocumentsAsync(int? uploadedByUserId = null)
    {
        var documents = await _documentRepository.GetDocumentsAsync(uploadedByUserId);
        return documents.Select(MapToResponse).ToList();
    }

    public async Task<DocumentDetailResponseDto?> GetDocumentByIdAsync(int id, int? currentUserId = null, bool isAdmin = false)
    {
        var document = await _documentRepository.GetDocumentWithDetailsAsync(id);
        if (document == null) return null;

        if (!isAdmin && currentUserId.HasValue && document.UploadedByUserId != currentUserId.Value)
        {
            return null;
        }

        return MapToDetailResponse(document);
    }

    public async Task<DocumentUploadResult> UploadAsync(IFormFile file, int uploadedByUserId)
    {
        if (file.Length == 0)
        {
            return DocumentUploadResult.Failure("The uploaded file is empty.");
        }

        var originalFileName = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(originalFileName);

        if (string.IsNullOrWhiteSpace(originalFileName) || !AllowedExtensions.Contains(extension))
        {
            return DocumentUploadResult.Failure(
                "Only PDF, PNG, JPG, DOCX, XLSX, TXT, and CSV files are allowed.");
        }

        var maxFileSize = _configuration.GetValue<long?>("DocumentUpload:MaxFileSizeBytes")
            ?? DefaultMaxFileSizeBytes;

        if (file.Length > maxFileSize)
        {
            return DocumentUploadResult.Failure(
                $"The uploaded file exceeds the {maxFileSize / (1024 * 1024)} MB size limit.");
        }

        var relativeStorageDirectory = _configuration["DocumentUpload:StorageDirectory"]
            ?? Path.Combine("storage", "documents");
        var storageDirectory = Path.GetFullPath(
            Path.Combine(_environment.ContentRootPath, relativeStorageDirectory));
        var storedFileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var storagePath = Path.Combine(storageDirectory, storedFileName);

        Directory.CreateDirectory(storageDirectory);

        try
        {
            await using (var fileStream = new FileStream(storagePath, FileMode.CreateNew, FileAccess.Write))
            {
                await file.CopyToAsync(fileStream);
            }

            var document = new DocumentRecord
            {
                OriginalFileName = originalFileName,
                StoredFileName = storedFileName,
                ContentType = file.ContentType ?? "application/octet-stream",
                FileSizeBytes = file.Length,
                StoragePath = storagePath,
                ProcessingStatus = DocumentProcessingStatus.Queued,
                UploadedAt = DateTime.UtcNow,
                UploadedByUserId = uploadedByUserId
            };

            _documentRepository.Add(document);
            await _documentRepository.SaveChangesAsync();

            // Enqueue for AI background processing pipeline
            await _processingQueue.QueueDocumentAsync(document.Id);

            return DocumentUploadResult.Success(MapToResponse(document));
        }
        catch
        {
            if (File.Exists(storagePath))
            {
                File.Delete(storagePath);
            }

            throw;
        }
    }

    public async Task<(byte[] Bytes, string ContentType, string FileName)?> DownloadDocumentAsync(
        int id,
        int? currentUserId = null,
        bool isAdmin = false)
    {
        var document = await _documentRepository.GetDocumentByIdAsync(id);
        if (document == null) return null;

        if (!isAdmin && currentUserId.HasValue && document.UploadedByUserId != currentUserId.Value)
        {
            return null;
        }

        if (!File.Exists(document.StoragePath))
        {
            _logger.LogWarning("File for document ID {DocumentId} does not exist at {StoragePath}", id, document.StoragePath);
            return null;
        }

        var bytes = await File.ReadAllBytesAsync(document.StoragePath);
        return (bytes, document.ContentType, document.OriginalFileName);
    }

    public async Task<bool> DeleteDocumentAsync(int id, int? currentUserId = null, bool isAdmin = false)
    {
        var document = await _documentRepository.GetDocumentByIdAsync(id);
        if (document == null) return false;

        if (!isAdmin && currentUserId.HasValue && document.UploadedByUserId != currentUserId.Value)
        {
            return false;
        }

        // Delete physical file from disk
        if (File.Exists(document.StoragePath))
        {
            try
            {
                File.Delete(document.StoragePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete physical file at {Path}", document.StoragePath);
            }
        }

        _documentRepository.Remove(document);
        await _documentRepository.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReprocessDocumentAsync(int id, int? currentUserId = null, bool isAdmin = false)
    {
        var document = await _documentRepository.GetDocumentByIdAsync(id);
        if (document == null) return false;

        if (!isAdmin && currentUserId.HasValue && document.UploadedByUserId != currentUserId.Value)
        {
            return false;
        }

        document.ProcessingStatus = DocumentProcessingStatus.Queued;
        await _documentRepository.SaveChangesAsync();

        await _processingQueue.QueueDocumentAsync(document.Id);
        return true;
    }

    private static DocumentResponseDto MapToResponse(DocumentRecord document) => new()
    {
        Id = document.Id,
        FileName = document.OriginalFileName,
        ContentType = document.ContentType,
        FileSizeBytes = document.FileSizeBytes,
        ProcessingStatus = document.ProcessingStatus,
        UploadedAt = document.UploadedAt,
        UploadedByUserId = document.UploadedByUserId
    };

    private static DocumentDetailResponseDto MapToDetailResponse(DocumentRecord document)
    {
        DocumentInsightDto? insightDto = null;
        if (document.Insight != null)
        {
            insightDto = new DocumentInsightDto
            {
                Id = document.Insight.Id,
                DocumentId = document.Insight.DocumentId,
                Category = document.Insight.Category,
                ConfidenceScore = document.Insight.ConfidenceScore,
                ExecutiveSummary = document.Insight.ExecutiveSummary,
                KeyHighlights = DeserializeListSafe(document.Insight.KeyHighlightsJson),
                KeyValues = DeserializeDictionarySafe(document.Insight.KeyValuesJson),
                Entities = DeserializeEntitiesSafe(document.Insight.EntitiesJson),
                ActionItems = DeserializeListSafe(document.Insight.ActionItemsJson),
                Language = document.Insight.Language,
                AiModelUsed = document.Insight.AiModelUsed,
                ProcessedAt = document.Insight.ProcessedAt
            };
        }

        DocumentExtractedContentDto? contentDto = null;
        if (document.ExtractedContent != null)
        {
            contentDto = new DocumentExtractedContentDto
            {
                DocumentId = document.ExtractedContent.DocumentId,
                RawText = document.ExtractedContent.RawText,
                PageCount = document.ExtractedContent.PageCount,
                WordCount = document.ExtractedContent.WordCount,
                ExtractedAt = document.ExtractedContent.ExtractedAt
            };
        }

        return new DocumentDetailResponseDto
        {
            Id = document.Id,
            FileName = document.OriginalFileName,
            ContentType = document.ContentType,
            FileSizeBytes = document.FileSizeBytes,
            ProcessingStatus = document.ProcessingStatus,
            UploadedAt = document.UploadedAt,
            UploadedByUserId = document.UploadedByUserId,
            UploadedByUserName = document.UploadedByUser?.FullName,
            ExtractedContent = contentDto,
            Insight = insightDto
        };
    }

    private static List<string> DeserializeListSafe(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<string>();
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
        catch { return new List<string>(); }
    }

    private static Dictionary<string, string> DeserializeDictionarySafe(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string, string>();
        try { return JsonSerializer.Deserialize<Dictionary<string, string>>(json) ?? new Dictionary<string, string>(); }
        catch { return new Dictionary<string, string>(); }
    }

    private static List<ExtractedEntityDto> DeserializeEntitiesSafe(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new List<ExtractedEntityDto>();
        try { return JsonSerializer.Deserialize<List<ExtractedEntityDto>>(json) ?? new List<ExtractedEntityDto>(); }
        catch { return new List<ExtractedEntityDto>(); }
    }
}
