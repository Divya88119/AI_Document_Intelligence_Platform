using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public interface IDocumentChatService
{
    Task<IReadOnlyList<DocumentChatMessageDto>> GetChatHistoryAsync(int documentId, int currentUserId, bool isAdmin = false);

    Task<DocumentChatMessageDto?> AskQuestionAsync(int documentId, string question, int currentUserId, bool isAdmin = false);
}

