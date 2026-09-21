using System.ComponentModel.DataAnnotations;

namespace DocumentIntelligence.API.Models.DTOs;

public class DocumentChatRequestDto
{
    [Required(ErrorMessage = "Question/message is required.")]
    public string Message { get; set; } = string.Empty;
}

public class DocumentChatMessageDto
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

