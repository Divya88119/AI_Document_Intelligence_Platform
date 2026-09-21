using DocumentIntelligence.API.Models.DTOs;

namespace DocumentIntelligence.API.Services.Interfaces;

public interface IDataAnalysisService
{
    Task<DataAnalysisReportResponseDto> AnalyzeFileAsync(
        IFormFile file,
        int currentUserId,
        CancellationToken cancellationToken = default);

    Task<DataAnalysisReportResponseDto> AnalyzeDocumentAsync(
        int documentId,
        int currentUserId,
        bool isAdmin = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DataAnalysisSummaryDto>> GetReportsAsync(
        int? currentUserId = null,
        bool isAdmin = false);

    Task<DataAnalysisReportResponseDto?> GetReportByIdAsync(
        int id,
        int? currentUserId = null,
        bool isAdmin = false);

    Task<string?> GetCleanedCsvAsync(
        int id,
        int? currentUserId = null,
        bool isAdmin = false);

    Task<string?> GetVersionCsvAsync(
        int id,
        string version,
        int? currentUserId = null,
        bool isAdmin = false);

    Task<DynamicChartResultDto> GenerateDynamicChartAsync(
        int id,
        DynamicChartRequestDto request,
        int? currentUserId = null,
        bool isAdmin = false,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteReportAsync(
        int id,
        int? currentUserId = null,
        bool isAdmin = false);
}
