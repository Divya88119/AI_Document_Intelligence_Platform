namespace DocumentIntelligence.API.Models.Entities;

public class DocumentChatMessage
{
    public int Id { get; set; }

    public int DocumentId { get; set; }

    public DocumentRecord Document { get; set; } = null!;

    public int UserId { get; set; }

    public User User { get; set; } = null!;

    public string Role { get; set; } = "user"; // "user" or "assistant"

    public string Message { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

