export type DocumentProcessingStatus = 'Uploaded' | 'Queued' | 'Processing' | 'Completed' | 'Failed';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  createdByUserId?: number;
  updatedAt?: string;
  updatedByUserId?: number;
}

export interface LoginResponse {
  token: string;
  expiration: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

export interface DocumentRecord {
  id: number;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  processingStatus: DocumentProcessingStatus;
  uploadedAt: string;
  uploadedByUserId: number;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  description?: string;
}

export interface DocumentInsight {
  id: number;
  documentId: number;
  category: string;
  confidenceScore: number;
  executiveSummary: string;
  keyHighlights: string[];
  keyValues: Record<string, string>;
  entities: ExtractedEntity[];
  actionItems: string[];
  language: string;
  aiModelUsed: string;
  processedAt: string;
}

export interface DocumentExtractedContent {
  documentId: number;
  rawText: string;
  pageCount: number;
  wordCount: number;
  extractedAt: string;
}

export interface DocumentDetail {
  id: number;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  processingStatus: DocumentProcessingStatus;
  uploadedAt: string;
  uploadedByUserId: number;
  uploadedByUserName?: string;
  extractedContent?: DocumentExtractedContent;
  insight?: DocumentInsight;
}

export interface DocumentChatMessage {
  id: number;
  documentId: number;
  userId: number;
  userName: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export interface DashboardStats {
  totalDocuments: number;
  completedDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  totalUsers: number;
  totalStorageBytes: number;
  categoryDistribution: Record<string, number>;
  recentDocuments: DocumentRecord[];
}

export interface ColumnProfile {
  name: string;
  dataType: string; // 'Numeric' | 'DateTime' | 'Categorical' | 'Text'
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  sampleValues: string[];
}

export interface DataQualityReport {
  healthScore: number;
  totalRows: number;
  totalColumns: number;
  totalMissingCells: number;
  missingDataPercentage: number;
  duplicateRowsCount: number;
  outliersDetectedCount: number;
  qualityAuditFindings: string[];
}

export interface CleaningAction {
  action: string;
  column: string;
  description: string;
  affectedRows: number;
}

export interface DescriptiveStats {
  column: string;
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q25: number;
  q75: number;
  skewness: number;
}

export interface CorrelationMatrix {
  columns: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}

export interface TimeSeriesChart {
  title: string;
  dateColumn: string;
  valueColumn: string;
  dataPoints: ChartPoint[];
}

export interface CategoryChart {
  title: string;
  categoryColumn: string;
  metricColumn: string;
  dataPoints: ChartPoint[];
}

export interface VisualReports {
  timeSeriesCharts: TimeSeriesChart[];
  categoricalCharts: CategoryChart[];
}

export interface ForecastPoint {
  period: string;
  forecastValue: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastSeries {
  targetMetric: string;
  dateDimension: string;
  historicalPast: ChartPoint[];
  futureForecast: ForecastPoint[];
  projectedGrowthRatePct: number;
  trendDirection: string; // 'Upward' | 'Downward' | 'Stable'
  modelConfidence: string;
}

export interface PredictiveForecasts {
  series: ForecastSeries[];
}

export interface DetailedTransformationAudit {
  stepId: number;
  actionCategory: string;
  targetColumn: string;
  rationale: string;
  affectedCount: number;
  sampleBefore: string[];
  sampleAfter: string[];
}

export interface DatasetVersionSnapshot {
  version: string;
  label: string;
  createdAt: string;
  totalRows: number;
  totalColumns: number;
  appliedChangesSummary: string;
}

export interface DynamicChartRequest {
  chartType: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter';
  xAxisColumn: string;
  yAxisColumn: string;
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  limit?: number;
  naturalLanguagePrompt?: string;
}

export interface DynamicChartResult {
  title: string;
  chartType: string;
  xAxisColumn: string;
  yAxisColumn: string;
  aggregation: string;
  dataPoints: ChartPoint[];
  description: string;
  suggestedInsights: string[];
}

export interface DataAnalysisReport {
  id: number;
  datasetName: string;
  documentId?: number;
  createdByUserId: number;
  currentVersion: string;
  totalRows: number;
  totalColumns: number;
  dataHealthScore: number;
  versionHistory: DatasetVersionSnapshot[];
  detailedAuditLog: DetailedTransformationAudit[];
  columnProfiles: ColumnProfile[];
  qualityAudit: DataQualityReport;
  cleaningLog: CleaningAction[];
  descriptiveStats: DescriptiveStats[];
  correlationMatrix: CorrelationMatrix;
  visualReports: VisualReports;
  predictiveForecasts: PredictiveForecasts;
  aiExecutiveSummary: string;
  aiKeyDrivers: string[];
  aiRecommendations: string[];
  createdAt: string;
}

export interface DataAnalysisSummary {
  id: number;
  datasetName: string;
  currentVersion: string;
  totalRows: number;
  totalColumns: number;
  dataHealthScore: number;
  createdAt: string;
}

