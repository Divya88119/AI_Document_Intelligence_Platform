using DocumentIntelligence.API.Services.Interfaces;
using System.Threading.Channels;

namespace DocumentIntelligence.API.Services;

public class DocumentProcessingQueue : IDocumentProcessingQueue
{
    private readonly Channel<int> _queue;

    public DocumentProcessingQueue(int capacity = 1000)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<int>(options);
    }

    public async ValueTask QueueDocumentAsync(int documentId, CancellationToken cancellationToken = default)
    {
        await _queue.Writer.WriteAsync(documentId, cancellationToken);
    }

    public async ValueTask<int> DequeueAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}

