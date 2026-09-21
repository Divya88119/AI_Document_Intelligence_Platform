namespace DocumentIntelligence.API.Models.Entities;

public class DataAnalysisReport
{
    public int Id { get; set; }

    public string DatasetName { get; set; } = string.Empty;

    public int? DocumentId { get; set; }

    public DocumentRecord? Document { get; set; }

    public int CreatedByUserId { get; set; }

    public User CreatedByUser { get; set; } = null!;

    public string CurrentVersion { get; set; } = "v1.1";

    public int TotalRows { get; set; }

    public int TotalColumns { get; set; }

    public double DataHealthScore { get; set; } = 100.0;

    // Raw & Cleaned Data storage for Versioning
    public string RawCsvData { get; set; } = string.Empty;

    public string CleanedCsvData { get; set; } = string.Empty;

    // JSON serializations for structured analysis & lineage
    public string VersionHistoryJson { get; set; } = "[]";

    public string DetailedAuditLogJson { get; set; } = "[]";

    public string ColumnProfilesJson { get; set; } = "[]";

    public string QualityAuditJson { get; set; } = "{}";

    public string CleaningLogJson { get; set; } = "[]";

    public string DescriptiveStatsJson { get; set; } = "[]";

    public string CorrelationMatrixJson { get; set; } = "{}";

    public string VisualReportsJson { get; set; } = "{}";

    public string PredictiveForecastsJson { get; set; } = "{}";

    public string AiExecutiveSummary { get; set; } = string.Empty;

    public string AiKeyDriversJson { get; set; } = "[]";

    public string AiRecommendationsJson { get; set; } = "[]";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
