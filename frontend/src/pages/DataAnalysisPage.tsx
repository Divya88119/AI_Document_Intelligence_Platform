import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analysisApi } from '../services/api';
import {
  DataAnalysisReport,
  DataAnalysisSummary,
  DynamicChartResult,
  DynamicChartRequest
} from '../types';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Download,
  Trash2,
  Layers,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  Database,
  Calculator,
  Grid,
  Lightbulb,
  Target,
  ChevronRight,
  Loader2,
  GitBranch,
  SlidersHorizontal,
  PieChart as PieChartIcon,
  CircleDot,
  ScatterChart as ScatterChartIcon,
  AreaChart as AreaChartIcon,
  Search,
  History,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RePieChart,
  Pie,
  Cell,
  ScatterChart as ReScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
} from 'recharts';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#eab308', // Yellow
];

export const DataAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [reports, setReports] = useState<DataAnalysisSummary[]>([]);
  const [currentReport, setCurrentReport] = useState<DataAnalysisReport | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('v1.1');
  const [activeTab, setActiveTab] = useState<'dynamic_viz' | 'transformations' | 'profile' | 'stats' | 'forecast' | 'insights'>('dynamic_viz');
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Chart Builder State
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter'>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>('');
  const [yAxisCol, setYAxisCol] = useState<string>('');
  const [aggregation, setAggregation] = useState<'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX'>('SUM');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [dynamicChartResult, setDynamicChartResult] = useState<DynamicChartResult | null>(null);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const list = await analysisApi.listReports();
      setReports(list);

      let targetReport: DataAnalysisReport | null = null;
      if (id) {
        const reportId = parseInt(id, 10);
        targetReport = await analysisApi.getReport(reportId);
      } else if (list.length > 0) {
        targetReport = await analysisApi.getReport(list[0].id);
      }

      if (targetReport) {
        setCurrentReport(targetReport);
        setSelectedVersion(targetReport.currentVersion || 'v1.1');
        initDefaultChart(targetReport);
      }
    } catch (err) {
      console.error('Failed to load data analysis reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const initDefaultChart = async (rep: DataAnalysisReport) => {
    const numCols = rep.columnProfiles.filter(p => p.dataType === 'Numeric').map(p => p.name);
    const allCols = rep.columnProfiles.map(p => p.name);
    const numCol = numCols[0] || allCols[allCols.length - 1] || '';
    const catCol = allCols.find(c => !numCols.includes(c)) || allCols[0] || '';

    setXAxisCol(catCol);
    setYAxisCol(numCol);

    try {
      setChartLoading(true);
      const res = await analysisApi.generateDynamicChart(rep.id, {
        chartType: 'bar',
        xAxisColumn: catCol,
        yAxisColumn: numCol,
        aggregation: 'SUM',
      });
      setDynamicChartResult(res);
    } catch (err) {
      console.error('Failed to init dynamic chart:', err);
    } finally {
      setChartLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [id]);

  // Handle Manual Dropdown Selection ("Apply Visual" Button or Direct Selection)
  const handleApplyManualVisual = async (overrideType?: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter') => {
    if (!currentReport) return;
    const targetType = overrideType || chartType;
    try {
      setChartLoading(true);
      const effectiveX = xAxisCol || currentReport.columnProfiles[0]?.name || '';
      const effectiveY = yAxisCol || currentReport.columnProfiles.find(p => p.dataType === 'Numeric')?.name || effectiveX;

      const req: DynamicChartRequest = {
        chartType: targetType,
        xAxisColumn: effectiveX,
        yAxisColumn: effectiveY,
        aggregation,
        naturalLanguagePrompt: '', // Explicitly empty so backend obeys manual dropdown selections!
      };

      const res = await analysisApi.generateDynamicChart(currentReport.id, req);
      setDynamicChartResult(res);
      setChartType(res.chartType as any);
    } catch (err) {
      console.error('Failed to generate dynamic chart:', err);
      alert('Failed to generate chart for selected parameters.');
    } finally {
      setChartLoading(false);
    }
  };

  // Immediate 1-click Chart Type Switcher
  const handleSelectChartType = (newType: 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter') => {
    setChartType(newType);
    if (dynamicChartResult) {
      if ((newType === 'scatter' && dynamicChartResult.chartType !== 'scatter') ||
          (dynamicChartResult.chartType === 'scatter' && newType !== 'scatter')) {
        handleApplyManualVisual(newType);
      } else {
        // Instant client-side visual morphing for maximum responsiveness
        setDynamicChartResult({
          ...dynamicChartResult,
          chartType: newType,
        });
      }
    }
  };

  // Handle AI Prompt Chart Assistant ("Generate Chart" Button or Suggestion Chips)
  const handleGenerateAiChart = async (overridePrompt?: string) => {
    if (!currentReport) return;
    const targetPrompt = overridePrompt !== undefined ? overridePrompt : aiPrompt;
    if (!targetPrompt.trim()) return;

    try {
      setChartLoading(true);
      const req: DynamicChartRequest = {
        chartType,
        xAxisColumn: xAxisCol,
        yAxisColumn: yAxisCol,
        aggregation,
        naturalLanguagePrompt: targetPrompt,
      };

      const res = await analysisApi.generateDynamicChart(currentReport.id, req);
      setDynamicChartResult(res);
      setChartType(res.chartType as any);
      setXAxisCol(res.xAxisColumn);
      setYAxisCol(res.yAxisColumn);
      setAggregation(res.aggregation as any);
    } catch (err) {
      console.error('Failed to generate AI prompt chart:', err);
      alert('Failed to generate chart for requested prompt.');
    } finally {
      setChartLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setAnalyzing(true);
      const rep = await analysisApi.uploadAndAnalyze(file);
      setShowUploadModal(false);
      await fetchReports();
      setCurrentReport(rep);
      navigate(`/analysis/${rep.id}`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Data Analysis failed on uploaded file.');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadSample = async (sampleType: 'sales' | 'saas' | 'hospital') => {
    try {
      setAnalyzing(true);
      let csvContent = '';
      let fileName = '';

      if (sampleType === 'sales') {
        fileName = 'Monthly_Retail_Sales_and_Revenue.csv';
        csvContent = `Month,Region,Category,UnitsSold,UnitPrice,AdSpend,Revenue,Profit
2025-01,North,Electronics,450,120.00,5000,54000,16200
2025-02,North,Electronics,480,120.00,5200,57600,17280
2025-03,North,Electronics,520,120.00,5500,62400,18720
2025-04,North,Apparel,980,45.00,4200,44100,13230
2025-05,South,Apparel,1120,45.00,4600,50400,15120
2025-06,South,HomeGoods,640,85.00,3800,54400,16320
2025-07,East,Electronics,610,120.00,5900,73200,21960
2025-08,East,Electronics,650,120.00,6100,78000,23400
2025-09,West,HomeGoods,720,85.00,4500,61200,18360
2025-10,West,Electronics,780,120.00,7000,93600,28080
2025-11,West,Electronics,890,120.00,8200,106800,32040
2025-12,West,Electronics,1050,120.00,9500,126000,37800
2025-12,West,Electronics,1050,120.00,9500,126000,37800`;
      } else if (sampleType === 'saas') {
        fileName = 'SaaS_Customer_Retention_Metrics.csv';
        csvContent = `CustomerID,TenureMonths,MonthlyCharges,TotalCharges,SupportTickets,UsageScore,Churned
101,12,65.50,786.00,1,88,0
102,4,45.00,180.00,5,42,1
103,24,120.00,2880.00,0,95,0
104,8,85.00,680.00,3,64,0
105,2,55.00,110.00,6,35,1
106,36,150.00,5400.00,1,98,0
107,18,90.00,1620.00,2,78,0
108,6,70.00,420.00,4,50,1
109,15,110.00,1650.00,1,85,0
110,30,135.00,4050.00,0,92,0`;
      } else {
        fileName = 'Hospital_Operations_and_Capacity.csv';
        csvContent = `RecordDate,Department,PatientCount,BedOccupancyPct,AvgStayDays,TotalCost
2025-01,Cardiology,145,82.5,4.2,185000
2025-02,Cardiology,152,85.0,4.1,192000
2025-03,Neurology,98,74.0,5.8,142000
2025-04,Orthopedics,210,89.5,3.4,225000
2025-05,Orthopedics,225,92.0,3.5,238000
2025-06,Pediatrics,180,78.0,2.8,135000
2025-07,Cardiology,168,88.0,4.0,210000
2025-08,Neurology,115,81.0,5.5,160000
2025-09,Pediatrics,195,83.5,2.9,148000
2025-10,Orthopedics,240,95.0,3.6,255000`;
      }

      const file = new File([csvContent], fileName, { type: 'text/csv' });
      const rep = await analysisApi.uploadAndAnalyze(file);
      setShowUploadModal(false);
      await fetchReports();
      setCurrentReport(rep);
      navigate(`/analysis/${rep.id}`);
    } catch (err) {
      alert('Failed to generate sample dataset analysis.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadSelectedVersion = async () => {
    if (!currentReport) return;
    try {
      await analysisApi.downloadVersionCsv(
        currentReport.id,
        selectedVersion,
        `${selectedVersion}_${currentReport.datasetName}`
      );
    } catch (err) {
      alert('Failed to download dataset version.');
    }
  };

  const handleDelete = async (idToDelete: number) => {
    if (!window.confirm('Delete this Data Analysis Report?')) return;
    try {
      await analysisApi.deleteReport(idToDelete);
      await fetchReports();
    } catch (err) {
      alert('Failed to delete report.');
    }
  };

  const numericColumns = currentReport?.columnProfiles.filter(p => p.dataType === 'Numeric').map(p => p.name) || [];
  const allColumns = currentReport?.columnProfiles.map(p => p.name) || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Version Lineage Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white">
                  Automated Data Analytics & Predictive Studio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-indigo-400" />
                  Lineage: {selectedVersion}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Transformation Audit, Version Control & Client-Customizable Dynamic Visual Reporting
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Version Lineage Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {reports.length > 0 && (
            <select
              value={currentReport?.id || ''}
              onChange={(e) => {
                const targetId = parseInt(e.target.value, 10);
                navigate(`/analysis/${targetId}`);
              }}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.datasetName} ({r.currentVersion || 'v1.1'})
                </option>
              ))}
            </select>
          )}

          {currentReport && currentReport.versionHistory && currentReport.versionHistory.length > 0 && (
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <select
                value={selectedVersion}
                onChange={(e) => setSelectedVersion(e.target.value)}
                className="px-2.5 py-1.5 bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                {currentReport.versionHistory.map((v) => (
                  <option key={v.version} value={v.version} className="bg-slate-900 text-slate-200">
                    {v.version}: {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleDownloadSelectedVersion}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
            title={`Download ${selectedVersion} Dataset`}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            Export {selectedVersion} CSV
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Ingest Dataset
          </button>

          {currentReport && (
            <button
              onClick={() => handleDelete(currentReport.id)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 transition-colors cursor-pointer"
              title="Delete this analysis report"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading || analyzing ? (
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-xs text-slate-400 font-medium">
            {analyzing ? 'Executing automated cleaning, versioning & predictive forecasting...' : 'Loading analysis report...'}
          </p>
        </div>
      ) : currentReport ? (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Version</div>
              <div className="text-base font-bold text-cyan-300 truncate mt-1 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                {selectedVersion}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{currentReport.datasetName}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dataset Shape</div>
              <div className="text-base font-extrabold text-white mt-1">
                {currentReport.totalRows} <span className="text-xs font-normal text-slate-400">Rows</span> × {currentReport.totalColumns} <span className="text-xs font-normal text-slate-400">Cols</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{currentReport.totalRows * currentReport.totalColumns} Total Data Points</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data Health Score</div>
              <div className="text-base font-extrabold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {currentReport.dataHealthScore.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Automated Quality Audit</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-md">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transformation Audit</div>
              <div className="text-base font-extrabold text-indigo-400 mt-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                {currentReport.detailedAuditLog?.length || currentReport.cleaningLog.length} Corrections
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Tracked with Before/After Diff</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 shadow-md flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lineage Snapshot</div>
              <div className="text-xs font-bold text-slate-200 mt-1 flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-purple-400" />
                {currentReport.versionHistory?.length || 2} Version Lineages
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Raw v1.0 &bull; Baseline v1.1</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
            {[
              { id: 'dynamic_viz', label: '🎨 Dynamic Chart Studio', icon: SlidersHorizontal },
              { id: 'transformations', label: '🧹 Transformation Audit & Diffs', icon: Layers },
              { id: 'profile', label: '📋 Data Profiling & Health', icon: Activity },
              { id: 'stats', label: '📊 Statistics & Correlation', icon: Calculator },
              { id: 'forecast', label: '🔮 Predictive Forecasting', icon: TrendingUp },
              { id: 'insights', label: '💡 AI Prescriptive Strategy', icon: Lightbulb },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: DYNAMIC VISUALIZATION STUDIO */}
          {activeTab === 'dynamic_viz' && (
            <div className="space-y-6">
              {/* Interactive Toolbar & Controls */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                      Client Dynamic Chart Builder & Visual Studio
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure dimensions, metrics, aggregations, or let the AI Assistant render the exact chart on demand.
                    </p>
                  </div>
                </div>

                {/* AI Natural Language Visual Prompt Assistant */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/50 via-purple-950/30 to-slate-950 border border-indigo-500/30">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Natural Language Chart Assistant:
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiChart()}
                        placeholder="e.g. 'Show average profit by region as a donut chart' or 'Plot units sold over month as line chart'"
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleGenerateAiChart()}
                      disabled={chartLoading || !aiPrompt.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {chartLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      Generate Chart
                    </button>
                  </div>

                  {/* 1-Click Prompt Suggestion Chips */}
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Suggested Prompts:</span>
                    {[
                      'Average Revenue by Region as Bar Chart',
                      'Profit by Category as Pie Chart',
                      'Revenue by Region as Donut Chart',
                      'UnitsSold over Month as Area Chart',
                      'AdSpend vs Profit as Scatter Plot',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setAiPrompt(chip);
                          handleGenerateAiChart(chip);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Manual Visual Config Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
                  {/* Chart Type Selector */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Chart Type</label>
                    <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[
                        { id: 'bar', icon: BarChart3, title: 'Bar' },
                        { id: 'line', icon: TrendingUp, title: 'Line' },
                        { id: 'area', icon: AreaChartIcon, title: 'Area' },
                        { id: 'pie', icon: PieChartIcon, title: 'Pie' },
                        { id: 'donut', icon: CircleDot, title: 'Donut' },
                        { id: 'scatter', icon: ScatterChartIcon, title: 'Scatter' },
                      ].map((ct) => {
                        const Icon = ct.icon;
                        const isSelected = chartType === ct.id;
                        return (
                          <button
                            key={ct.id}
                            onClick={() => handleSelectChartType(ct.id as any)}
                            title={`${ct.title} Chart`}
                            className={`p-1.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[9px] font-semibold">{ct.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* X-Axis Dimension */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">X-Axis Dimension</label>
                    <select
                      value={xAxisCol || allColumns[0] || ''}
                      onChange={(e) => setXAxisCol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {allColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Y-Axis Metric */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Y-Axis Metric</label>
                    <select
                      value={yAxisCol || numericColumns[0] || allColumns[0] || ''}
                      onChange={(e) => setYAxisCol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {numericColumns.map((col) => (
                        <option key={col} value={col}>
                          {col} (Numeric)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Aggregation Function */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Aggregation</label>
                    <select
                      value={aggregation}
                      onChange={(e) => setAggregation(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="SUM">SUM (Total Value)</option>
                      <option value="AVG">AVG (Mean Average)</option>
                      <option value="COUNT">COUNT (Frequency)</option>
                      <option value="MIN">MIN (Minimum)</option>
                      <option value="MAX">MAX (Maximum)</option>
                    </select>
                  </div>

                  {/* Apply Custom Button */}
                  <div className="flex items-end">
                    <button
                      onClick={() => handleApplyManualVisual()}
                      disabled={chartLoading}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {chartLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                      Apply Visual
                    </button>
                  </div>
                </div>
              </div>

              {/* Rendered Chart Canvas */}
              {dynamicChartResult && (
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-2xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        {dynamicChartResult.title}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800/60 tracking-wider">
                          {dynamicChartResult.chartType} visual
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{dynamicChartResult.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                        {dynamicChartResult.dataPoints.length} Data Segments
                      </div>
                    </div>
                  </div>

                  {/* Chart Graphic Render */}
                  <div className="min-h-[350px] bg-slate-950/90 rounded-2xl p-4 sm:p-6 border border-slate-800/90 flex flex-col justify-center">
                    {/* BAR CHART */}
                    {dynamicChartResult.chartType === 'bar' && (
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dynamicChartResult.dataPoints} margin={{ top: 15, right: 25, left: 15, bottom: 35 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis
                              dataKey="label"
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              angle={-20}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString() : v)}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                              }}
                              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, dynamicChartResult.yAxisColumn]}
                            />
                            <Bar dataKey="value" name={dynamicChartResult.yAxisColumn} radius={[6, 6, 0, 0]}>
                              {dynamicChartResult.dataPoints.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* LINE CHART */}
                    {dynamicChartResult.chartType === 'line' && (
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dynamicChartResult.dataPoints} margin={{ top: 15, right: 25, left: 15, bottom: 35 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="label"
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              angle={-20}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString() : v)}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, dynamicChartResult.yAxisColumn]}
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name={dynamicChartResult.yAxisColumn}
                              stroke="#06b6d4"
                              strokeWidth={3}
                              dot={{ r: 5, fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 2 }}
                              activeDot={{ r: 8, fill: '#22d3ee', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* AREA CHART */}
                    {dynamicChartResult.chartType === 'area' && (
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dynamicChartResult.dataPoints} margin={{ top: 15, right: 25, left: 15, bottom: 35 }}>
                            <defs>
                              <linearGradient id="areaGradientDynamic" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.7} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              dataKey="label"
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              angle={-20}
                              textAnchor="end"
                              interval={0}
                            />
                            <YAxis
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString() : v)}
                            />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, dynamicChartResult.yAxisColumn]}
                            />
                            <Area
                              type="monotone"
                              dataKey="value"
                              name={dynamicChartResult.yAxisColumn}
                              stroke="#a855f7"
                              strokeWidth={3}
                              fillOpacity={1}
                              fill="url(#areaGradientDynamic)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* PIE CHART (Solid Circular Pie) */}
                    {dynamicChartResult.chartType === 'pie' && (
                      <div className="w-full h-[320px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, dynamicChartResult.yAxisColumn]}
                            />
                            <RechartsLegend
                              verticalAlign="bottom"
                              height={36}
                              wrapperStyle={{ color: '#94a3b8', fontSize: '11px', paddingTop: '10px' }}
                            />
                            <Pie
                              data={dynamicChartResult.dataPoints}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="45%"
                              outerRadius={105}
                              paddingAngle={2}
                              label={({ name, percent }: any) => `${name || ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {dynamicChartResult.dataPoints.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* DONUT CHART (Ring Pie) */}
                    {dynamicChartResult.chartType === 'donut' && (
                      <div className="w-full h-[320px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                              formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString() : value, dynamicChartResult.yAxisColumn]}
                            />
                            <RechartsLegend
                              verticalAlign="bottom"
                              height={36}
                              wrapperStyle={{ color: '#94a3b8', fontSize: '11px', paddingTop: '10px' }}
                            />
                            <Pie
                              data={dynamicChartResult.dataPoints}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="45%"
                              innerRadius={60}
                              outerRadius={105}
                              paddingAngle={3}
                              label={({ name, percent }: any) => `${name || ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {dynamicChartResult.dataPoints.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* SCATTER PLOT */}
                    {dynamicChartResult.chartType === 'scatter' && (
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ReScatterChart margin={{ top: 20, right: 30, bottom: 25, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                              type="number"
                              dataKey="value"
                              name={dynamicChartResult.xAxisColumn}
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              label={{ value: dynamicChartResult.xAxisColumn, position: 'insideBottom', offset: -12, fill: '#94a3b8', fontSize: 11 }}
                            />
                            <YAxis
                              type="number"
                              dataKey="secondaryValue"
                              name={dynamicChartResult.yAxisColumn}
                              stroke="#64748b"
                              tick={{ fill: '#94a3b8', fontSize: 11 }}
                              label={{ value: dynamicChartResult.yAxisColumn, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                            />
                            <ZAxis range={[70, 70]} />
                            <RechartsTooltip
                              cursor={{ strokeDasharray: '3 3' }}
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                borderRadius: '12px',
                                color: '#f8fafc',
                                fontSize: '12px',
                              }}
                              formatter={(value: any, name: any) => [typeof value === 'number' ? value.toLocaleString() : value, name]}
                            />
                            <Scatter name="Data Points" data={dynamicChartResult.dataPoints} fill="#ec4899" />
                          </ReScatterChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Aggregated Total</div>
                      <div className="text-base font-extrabold text-white font-mono mt-0.5">
                        {dynamicChartResult.dataPoints.reduce((acc, p) => acc + p.value, 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Peak Category</div>
                      <div className="text-base font-extrabold text-cyan-300 font-mono mt-0.5 truncate">
                        {dynamicChartResult.dataPoints.length > 0
                          ? [...dynamicChartResult.dataPoints].sort((a, b) => b.value - a.value)[0]?.label
                          : 'N/A'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Segment Average</div>
                      <div className="text-base font-extrabold text-purple-300 font-mono mt-0.5">
                        {dynamicChartResult.dataPoints.length > 0
                          ? (dynamicChartResult.dataPoints.reduce((acc, p) => acc + p.value, 0) / dynamicChartResult.dataPoints.length).toFixed(1)
                          : '0'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Aggregation Type</div>
                      <div className="text-base font-extrabold text-emerald-300 font-mono mt-0.5 uppercase">
                        {dynamicChartResult.aggregation}
                      </div>
                    </div>
                  </div>

                  {/* Insights Card */}
                  {dynamicChartResult.suggestedInsights && dynamicChartResult.suggestedInsights.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                      <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
                        Automated Visual Findings:
                      </div>
                      {dynamicChartResult.suggestedInsights.map((ins, idx) => (
                        <div key={idx} className="text-xs text-slate-300 flex items-center gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span>{ins}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TRANSFORMATION AUDIT & DIFFS */}
          {activeTab === 'transformations' && (
            <div className="space-y-6">
              {/* Version Control Lineage Summary */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-cyan-400" />
                  Dataset Version Lineage & History
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentReport.versionHistory && currentReport.versionHistory.length > 0 ? (
                    currentReport.versionHistory.map((ver) => (
                      <div
                        key={ver.version}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedVersion === ver.version
                            ? 'bg-indigo-950/40 border-indigo-500/50'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-slate-900 text-cyan-300 border border-slate-700">
                            {ver.version}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ver.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-100 mt-2">{ver.label}</div>
                        <p className="text-[11px] text-slate-400 mt-1">{ver.appliedChangesSummary}</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                          <span>{ver.totalRows} Rows × {ver.totalColumns} Cols</span>
                          <button
                            onClick={() => {
                              setSelectedVersion(ver.version);
                              handleDownloadSelectedVersion();
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                          >
                            Export CSV &rarr;
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950 text-xs text-slate-400">
                      Standard v1.0 and v1.1 version lineage tracked.
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Transformations & Corrections Audit View */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      Detailed Transformation & Data Correction Audit
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Step-by-step audit of mathematical transformations, imputations, and deduplications applied to the raw data.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadSelectedVersion}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Cleaned CSV
                  </button>
                </div>

                {currentReport.detailedAuditLog && currentReport.detailedAuditLog.length > 0 ? (
                  <div className="space-y-4">
                    {currentReport.detailedAuditLog.map((audit) => (
                      <div key={audit.stepId} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-xs font-bold flex items-center justify-center">
                              #{audit.stepId}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                              {audit.actionCategory}
                            </span>
                            <span className="text-xs font-bold text-slate-100">{audit.targetColumn}</span>
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-300">
                            {audit.affectedCount} Cell(s) / Record(s) Corrected
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                          <span className="font-bold text-slate-400">Technical Rationale:</span> {audit.rationale}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs space-y-1">
                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Before (Raw Noisy Data)</div>
                            <div className="font-mono text-slate-300 text-[11px]">
                              {audit.sampleBefore && audit.sampleBefore.length > 0
                                ? audit.sampleBefore.join(', ')
                                : 'Missing / Null / Noisy cells'}
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs space-y-1">
                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">After (Corrected & Standardized)</div>
                            <div className="font-mono text-slate-300 text-[11px]">
                              {audit.sampleAfter && audit.sampleAfter.length > 0
                                ? audit.sampleAfter.join(', ')
                                : 'Imputed / Pruned canonical state'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentReport.cleaningLog.map((action, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                              {action.action}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{action.column}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5">{action.description}</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-300 whitespace-nowrap">
                          {action.affectedRows} row(s) updated
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DATA PROFILING & HEALTH */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Data Quality Audit & Diagnostics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Total Missing Cells:</span>
                    <span className="font-bold text-slate-100 ml-2">{currentReport.qualityAudit.totalMissingCells} ({currentReport.qualityAudit.missingDataPercentage}%)</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Duplicate Records:</span>
                    <span className="font-bold text-slate-100 ml-2">{currentReport.qualityAudit.duplicateRowsCount}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <span className="text-slate-400">Statistical Outliers:</span>
                    <span className="font-bold text-slate-100 ml-2">{currentReport.qualityAudit.outliersDetectedCount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {currentReport.qualityAudit.qualityAuditFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 flex items-center gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Feature Inferred Schema & Cardinality Profiles
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-slate-400 uppercase bg-slate-950/40 border-b border-slate-800/80">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Column Feature</th>
                        <th className="px-4 py-3 font-semibold">Inferred Type</th>
                        <th className="px-4 py-3 font-semibold">Null Count</th>
                        <th className="px-4 py-3 font-semibold">Distinct Values</th>
                        <th className="px-5 py-3 font-semibold">Sample Extracted Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-sans">
                      {currentReport.columnProfiles.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-800/30">
                          <td className="px-5 py-3.5 font-bold text-slate-100">{col.name}</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                col.dataType === 'Numeric'
                                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                                  : col.dataType === 'DateTime'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {col.dataType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {col.nullCount > 0 ? (
                              <span className="text-amber-400 font-semibold">{col.nullCount} ({col.nullPercentage}%)</span>
                            ) : (
                              <span className="text-emerald-400">0 (0%)</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">{col.uniqueCount}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex gap-1.5 flex-wrap">
                              {col.sampleValues.map((v, i) => (
                                <span key={i} className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300">
                                  {v}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STATISTICS & CORRELATION */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    Descriptive Statistics & Dispersion (Numeric Features)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-slate-400 uppercase bg-slate-950/40 border-b border-slate-800/80">
                      <tr>
                        <th className="px-5 py-3 font-sans font-semibold">Column</th>
                        <th className="px-4 py-3 font-semibold">Count</th>
                        <th className="px-4 py-3 font-semibold">Mean (μ)</th>
                        <th className="px-4 py-3 font-semibold">Median</th>
                        <th className="px-4 py-3 font-semibold">Std Dev (σ)</th>
                        <th className="px-4 py-3 font-semibold">Min</th>
                        <th className="px-4 py-3 font-semibold">Max</th>
                        <th className="px-4 py-3 font-semibold">Q25 (25%)</th>
                        <th className="px-4 py-3 font-semibold">Q75 (75%)</th>
                        <th className="px-4 py-3 font-semibold">Skewness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {currentReport.descriptiveStats.map((stat) => (
                        <tr key={stat.column} className="hover:bg-slate-800/30">
                          <td className="px-5 py-3.5 font-sans font-bold text-slate-100">{stat.column}</td>
                          <td className="px-4 py-3.5 text-slate-300">{stat.count}</td>
                          <td className="px-4 py-3.5 font-bold text-cyan-300">{stat.mean.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-200">{stat.median.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-300">{stat.stdDev.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-400">{stat.min.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-400">{stat.max.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-300">{stat.q25.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-slate-300">{stat.q75.toLocaleString()}</td>
                          <td className="px-4 py-3.5">
                            <span className={stat.skewness > 0.5 ? 'text-amber-400' : stat.skewness < -0.5 ? 'text-purple-400' : 'text-slate-300'}>
                              {stat.skewness}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {currentReport.correlationMatrix && currentReport.correlationMatrix.columns.length > 0 && (
                <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <Grid className="w-4 h-4 text-purple-400" />
                    Pearson Correlation Coefficient Matrix (-1.0 to +1.0)
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Measures linear dependency between continuous features. Values close to +1 indicate strong positive alignment.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="text-xs font-mono border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2.5 text-left font-sans text-slate-400"></th>
                          {currentReport.correlationMatrix.columns.map((c) => (
                            <th key={c} className="p-2.5 text-center font-sans text-slate-300 font-semibold max-w-[120px] truncate">
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentReport.correlationMatrix.columns.map((rowCol) => (
                          <tr key={rowCol}>
                            <td className="p-2.5 font-sans font-bold text-slate-300 text-left">{rowCol}</td>
                            {currentReport.correlationMatrix.columns.map((colCol) => {
                              const val = currentReport.correlationMatrix.matrix[rowCol]?.[colCol] ?? 0;
                              const isSelf = rowCol === colCol;
                              return (
                                <td
                                  key={colCol}
                                  className={`p-2.5 text-center font-bold rounded-lg border border-slate-900 ${
                                    isSelf
                                      ? 'bg-slate-800 text-slate-400'
                                      : val > 0.6
                                      ? 'bg-emerald-950/80 text-emerald-300'
                                      : val > 0.2
                                      ? 'bg-indigo-950/70 text-indigo-300'
                                      : val < -0.4
                                      ? 'bg-rose-950/80 text-rose-300'
                                      : 'bg-slate-950 text-slate-400'
                                  }`}
                                >
                                  {val.toFixed(2)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PREDICTIVE FORECASTING */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {currentReport.predictiveForecasts.series.map((series, idx) => {
                const allVals = [
                  ...series.historicalPast.map((p) => p.value),
                  ...series.futureForecast.map((f) => f.forecastValue),
                ];
                const maxVal = Math.max(...allVals, 1);

                return (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-extrabold text-white">
                            Future Trajectory: {series.targetMetric}
                          </h3>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                              series.trendDirection === 'Upward'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                : series.trendDirection === 'Downward'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {series.trendDirection} ({series.projectedGrowthRatePct > 0 ? `+${series.projectedGrowthRatePct}%` : `${series.projectedGrowthRatePct}%`})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Regression Extrapolation & Trend Forecasting with {series.modelConfidence}
                        </p>
                      </div>
                    </div>

                    <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-4 bg-slate-950/70 rounded-xl border border-slate-800 overflow-x-auto mb-6">
                      {series.historicalPast.map((hp, i) => {
                        const hPct = Math.max(8, Math.round((hp.value / maxVal) * 100));
                        return (
                          <div key={`hist-${i}`} className="flex-1 min-w-[40px] flex flex-col items-center gap-2">
                            <div className="text-[9px] text-slate-400 font-mono">{hp.value.toLocaleString()}</div>
                            <div
                              className="w-full bg-slate-700 hover:bg-slate-600 rounded-t-md transition-all"
                              style={{ height: `${hPct}%` }}
                              title={`Historical: ${hp.value}`}
                            />
                            <div className="text-[9px] text-slate-400 truncate font-mono">Past {i + 1}</div>
                          </div>
                        );
                      })}

                      {series.futureForecast.map((fp, i) => {
                        const hPct = Math.max(8, Math.round((fp.forecastValue / maxVal) * 100));
                        return (
                          <div key={`fut-${i}`} className="flex-1 min-w-[40px] flex flex-col items-center gap-2">
                            <div className="text-[9px] text-cyan-300 font-bold font-mono">{fp.forecastValue.toLocaleString()}</div>
                            <div
                              className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-md border-t-2 border-cyan-300 shadow-lg shadow-cyan-500/30 animate-pulse"
                              style={{ height: `${hPct}%` }}
                              title={`Predicted: ${fp.forecastValue} (Range: ${fp.lowerBound} - ${fp.upperBound})`}
                            />
                            <div className="text-[9px] text-cyan-300 font-bold font-mono">{fp.period}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                      {series.futureForecast.map((fp, i) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                          <div className="text-[10px] uppercase font-bold text-cyan-400">{fp.period}</div>
                          <div className="text-sm font-extrabold text-white mt-0.5">{fp.forecastValue.toLocaleString()}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">Range: [{fp.lowerBound}, {fp.upperBound}]</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 6: AI PRESCRIPTIVE INSIGHTS */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/20">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  AI Analytical Executive Summary
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentReport.aiExecutiveSummary}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  Identified Statistical Drivers & Patterns
                </h3>
                <div className="space-y-2.5">
                  {currentReport.aiKeyDrivers.map((driver, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <span>{driver}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Prescriptive Strategy & Recommended Next Actions
                </h3>
                <div className="space-y-2.5">
                  {currentReport.aiRecommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/80 p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">No Datasets Ingested Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload any CSV, Excel, or JSON dataset or generate a sample dataset to see automated data cleaning, EDA, visual charts, and predictive forecasting in action!
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Upload Dataset
            </button>
            <button
              onClick={() => handleLoadSample('sales')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              1-Click Demo Sales Dataset
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Ingest Tabular Dataset</h3>
                <p className="text-xs text-slate-400">Upload your own file or launch a pre-built sample dataset</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileSpreadsheet className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-200">Click to upload CSV or Excel spreadsheet</div>
              <div className="text-[11px] text-slate-500 mt-1">Supports .csv, .xlsx, .json</div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                Instant 1-Click Course Sample Datasets:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleLoadSample('sales')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-cyan-300">Retail Sales & Revenue</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Time-Series Trends & Profit</div>
                </button>

                <button
                  onClick={() => handleLoadSample('saas')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-purple-300">Customer Churn</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tenure & Support EDA</div>
                </button>

                <button
                  onClick={() => handleLoadSample('hospital')}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-bold text-emerald-300">Hospital Capacity</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Bed Occupancy & Costs</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
