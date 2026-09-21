using DocumentIntelligence.API.Data;
using DocumentIntelligence.API.Models.Entities;
using DocumentIntelligence.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DocumentIntelligence.API.Services;

public class DocumentProcessingWorker : BackgroundService
{
    private readonly IDocumentProcessingQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DocumentProcessingWorker> _logger;

    public DocumentProcessingWorker(
        IDocumentProcessingQueue queue,
        IServiceProvider serviceProvider,
        ILogger<DocumentProcessingWorker> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("DocumentProcessingWorker background service started.");

        // On startup, find any documents that were left in Uploaded/Queued status and queue them
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var pendingDocs = await context.Documents
                .Where(d => d.ProcessingStatus == DocumentProcessingStatus.Uploaded ||
                            d.ProcessingStatus == DocumentProcessingStatus.Queued)
                .Select(d => d.Id)
                .ToListAsync(stoppingToken);

            foreach (var docId in pendingDocs)
            {
                await _queue.QueueDocumentAsync(docId, stoppingToken);
                _logger.LogInformation("Enqueued pending document ID {DocumentId} on worker startup.", docId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not check pending documents on worker startup.");
        }

        // Main processing loop
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var documentId = await _queue.DequeueAsync(stoppingToken);
                await ProcessDocumentAsync(documentId, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in document processing worker loop.");
            }
        }

        _logger.LogInformation("DocumentProcessingWorker background service stopped.");
    }

    private async Task ProcessDocumentAsync(int documentId, CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var extractor = scope.ServiceProvider.GetRequiredService<ITextExtractorService>();
        var aiService = scope.ServiceProvider.GetRequiredService<IAiIntelligenceService>();

        var document = await context.Documents
            .Include(d => d.ExtractedContent)
            .Include(d => d.Insight)
            .FirstOrDefaultAsync(d => d.Id == documentId, cancellationToken);

        if (document == null)
        {
            _logger.LogWarning("Document ID {DocumentId} not found for processing.", documentId);
            return;
        }

        try
        {
            _logger.LogInformation("Starting processing for Document ID {DocumentId} ({FileName})", document.Id, document.OriginalFileName);
            document.ProcessingStatus = DocumentProcessingStatus.Processing;
            await context.SaveChangesAsync(cancellationToken);

            // Step 1: Extract Text & Structural Content
            var extractionResult = await extractor.ExtractTextAsync(
                document.StoragePath,
                document.ContentType,
                cancellationToken);

            var extractedContent = document.ExtractedContent ?? new DocumentExtractedContent
            {
                DocumentId = document.Id
            };

            extractedContent.RawText = extractionResult.RawText;
            extractedContent.PageCount = extractionResult.PageCount;
            extractedContent.WordCount = extractionResult.WordCount;
            extractedContent.ExtractedAt = DateTime.UtcNow;

            if (document.ExtractedContent == null)
            {
                context.DocumentExtractedContents.Add(extractedContent);
            }

            await context.SaveChangesAsync(cancellationToken);

            // Step 2: AI Intelligence Analysis (Classification, Summarization, Entities, Key-Values)
            var aiResult = await aiService.AnalyzeDocumentAsync(
                document.OriginalFileName,
                extractionResult.RawText,
                cancellationToken);

            var insight = document.Insight ?? new DocumentInsight
            {
                DocumentId = document.Id
            };

            insight.Category = aiResult.Category;
            insight.ConfidenceScore = aiResult.ConfidenceScore;
            insight.ExecutiveSummary = aiResult.ExecutiveSummary;
            insight.KeyHighlightsJson = JsonSerializer.Serialize(aiResult.KeyHighlights);
            insight.KeyValuesJson = JsonSerializer.Serialize(aiResult.KeyValues);
            insight.EntitiesJson = JsonSerializer.Serialize(aiResult.Entities);
            insight.ActionItemsJson = JsonSerializer.Serialize(aiResult.ActionItems);
            insight.Language = aiResult.Language;
            insight.AiModelUsed = aiResult.AiModelUsed;
            insight.ProcessedAt = DateTime.UtcNow;

            if (document.Insight == null)
            {
                context.DocumentInsights.Add(insight);
            }

            document.ProcessingStatus = DocumentProcessingStatus.Completed;
            await context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully completed processing Document ID {DocumentId}. Category: {Category}", document.Id, aiResult.Category);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process Document ID {DocumentId}", document.Id);
            document.ProcessingStatus = DocumentProcessingStatus.Failed;
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

