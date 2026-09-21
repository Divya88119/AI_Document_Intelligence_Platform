using System.ComponentModel.DataAnnotations;

namespace DocumentIntelligence.API.Models.DTOs;

public class DocumentUploadRequestDto
{
    [Required(ErrorMessage = "A document file is required.")]
    public IFormFile File { get; set; } = null!;
}
