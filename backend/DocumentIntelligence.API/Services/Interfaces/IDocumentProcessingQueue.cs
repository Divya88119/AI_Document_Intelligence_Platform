namespace DocumentIntelligence.API.Services.Interfaces;

public interface IDocumentProcessingQueue
{
    ValueTask QueueDocumentAsync(int documentId, CancellationToken cancellationToken = default);
    ValueTask<int> DequeueAsync(CancellationToken cancellationToken);
}

