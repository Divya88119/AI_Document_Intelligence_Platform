namespace DocumentIntelligence.API.Models.DTOs;

public class ColumnProfileDto
{
    public string Name { get; set; } = string.Empty;
    public string DataType { get; set; } = "string"; // "Numeric", "DateTime", "Categorical", "Text"
    public int NullCount { get; set; }
    public double NullPercentage { get; set; }
    public int UniqueCount { get; set; }
    public List<string> SampleValues { get; set; } = new();
}

public class DataQualityReportDto
{
    public double HealthScore { get; set; } = 100.0;
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public int TotalMissingCells { get; set; }
    public double MissingDataPercentage { get; set; }
    public int DuplicateRowsCount { get; set; }
    public int OutliersDetectedCount { get; set; }
    public List<string> QualityAuditFindings { get; set; } = new();
}

public class CleaningActionDto
{
    public string Action { get; set; } = string.Empty;
    public string Column { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int AffectedRows { get; set; }
}

public class DetailedTransformationAuditDto
{
    public int StepId { get; set; }
    public string ActionCategory { get; set; } = string.Empty;
    public string TargetColumn { get; set; } = string.Empty;
    public string Rationale { get; set; } = string.Empty;
    public int AffectedCount { get; set; }
    public List<string> SampleBefore { get; set; } = new();
    public List<string> SampleAfter { get; set; } = new();
}

public class DatasetVersionSnapshotDto
{
    public string Version { get; set; } = "v1.0";
    public string Label { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public string AppliedChangesSummary { get; set; } = string.Empty;
}

public class DescriptiveStatsDto
{
    public string Column { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Mean { get; set; }
    public double Median { get; set; }
    public double StdDev { get; set; }
    public double Min { get; set; }
    public double Max { get; set; }
    public double Q25 { get; set; }
    public double Q75 { get; set; }
    public double Skewness { get; set; }
}

public class CorrelationMatrixDto
{
    public List<string> Columns { get; set; } = new();
    public Dictionary<string, Dictionary<string, double>> Matrix { get; set; } = new();
}

public class ChartPointDto
{
    public string Label { get; set; } = string.Empty;
    public double Value { get; set; }
    public double? SecondaryValue { get; set; }
    public string? Category { get; set; }
}

public class TimeSeriesChartDto
{
    public string Title { get; set; } = string.Empty;
    public string DateColumn { get; set; } = string.Empty;
    public string ValueColumn { get; set; } = string.Empty;
    public List<ChartPointDto> DataPoints { get; set; } = new();
}

public class CategoryChartDto
{
    public string Title { get; set; } = string.Empty;
    public string CategoryColumn { get; set; } = string.Empty;
    public string MetricColumn { get; set; } = string.Empty;
    public List<ChartPointDto> DataPoints { get; set; } = new();
}

public class VisualReportsDto
{
    public List<TimeSeriesChartDto> TimeSeriesCharts { get; set; } = new();
    public List<CategoryChartDto> CategoricalCharts { get; set; } = new();
}

public class ForecastPointDto
{
    public string Period { get; set; } = string.Empty;
    public double ForecastValue { get; set; }
    public double LowerBound { get; set; }
    public double UpperBound { get; set; }
}

public class ForecastSeriesDto
{
    public string TargetMetric { get; set; } = string.Empty;
    public string DateDimension { get; set; } = string.Empty;
    public List<ChartPointDto> HistoricalPast { get; set; } = new();
    public List<ForecastPointDto> FutureForecast { get; set; } = new();
    public double ProjectedGrowthRatePct { get; set; }
    public string TrendDirection { get; set; } = "Upward"; // "Upward", "Downward", "Stable"
    public string ModelConfidence { get; set; } = "High (95% Interval)";
}

public class PredictiveForecastsDto
{
    public List<ForecastSeriesDto> Series { get; set; } = new();
}

public class DynamicChartRequestDto
{
    public string ChartType { get; set; } = "bar"; // "bar", "line", "area", "donut", "scatter"
    public string XAxisColumn { get; set; } = string.Empty;
    public string YAxisColumn { get; set; } = string.Empty;
    public string Aggregation { get; set; } = "SUM"; // "SUM", "AVG", "COUNT", "MIN", "MAX"
    public int Limit { get; set; } = 15;
    public string? NaturalLanguagePrompt { get; set; }
}

public class DynamicChartResultDto
{
    public string Title { get; set; } = string.Empty;
    public string ChartType { get; set; } = "bar";
    public string XAxisColumn { get; set; } = string.Empty;
    public string YAxisColumn { get; set; } = string.Empty;
    public string Aggregation { get; set; } = "SUM";
    public List<ChartPointDto> DataPoints { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public List<string> SuggestedInsights { get; set; } = new();
}

public class DataAnalysisReportResponseDto
{
    public int Id { get; set; }
    public string DatasetName { get; set; } = string.Empty;
    public int? DocumentId { get; set; }
    public int CreatedByUserId { get; set; }
    public string CurrentVersion { get; set; } = "v1.1";
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public double DataHealthScore { get; set; }
    public List<DatasetVersionSnapshotDto> VersionHistory { get; set; } = new();
    public List<DetailedTransformationAuditDto> DetailedAuditLog { get; set; } = new();
    public List<ColumnProfileDto> ColumnProfiles { get; set; } = new();
    public DataQualityReportDto QualityAudit { get; set; } = new();
    public List<CleaningActionDto> CleaningLog { get; set; } = new();
    public List<DescriptiveStatsDto> DescriptiveStats { get; set; } = new();
    public CorrelationMatrixDto CorrelationMatrix { get; set; } = new();
    public VisualReportsDto VisualReports { get; set; } = new();
    public PredictiveForecastsDto PredictiveForecasts { get; set; } = new();
    public string AiExecutiveSummary { get; set; } = string.Empty;
    public List<string> AiKeyDrivers { get; set; } = new();
    public List<string> AiRecommendations { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class DataAnalysisSummaryDto
{
    public int Id { get; set; }
    public string DatasetName { get; set; } = string.Empty;
    public string CurrentVersion { get; set; } = "v1.1";
    public int TotalRows { get; set; }
    public int TotalColumns { get; set; }
    public double DataHealthScore { get; set; }
    public DateTime CreatedAt { get; set; }
}
