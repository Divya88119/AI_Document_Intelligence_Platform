import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { CategoryBadge } from '../components/CategoryBadge';
import { DropzoneUpload } from '../components/DropzoneUpload';
import {
  FileText,
  CheckCircle2,
  Clock,
  HardDrive,
  ArrowRight,
  TrendingUp,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll stats every 10 seconds to show live background processing updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <span>Intelligence Overview</span>
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, AI extraction pipeline, and document analytics.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Ingested</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{stats?.totalDocuments || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Active document records</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Completed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-3">{stats?.completedDocuments || 0}</div>
          <div className="text-xs text-slate-400 mt-1">
            {stats?.totalDocuments ? Math.round(((stats.completedDocuments || 0) / stats.totalDocuments) * 100) : 0}% success rate
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing Queue</span>
            <div className="w-9 h-9 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-3">{stats?.processingDocuments || 0}</div>
          <div className="text-xs text-slate-400 mt-1">In worker channel queue</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Utilized</span>
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">
            {formatBytes(stats?.totalStorageBytes || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Local encrypted repository</div>
        </div>
      </div>

      {/* Main Grid: Upload & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Zone */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <h2 className="text-base font-bold text-slate-100 mb-1">Quick Ingestion Studio</h2>
          <p className="text-xs text-slate-400 mb-4">
            Upload PDFs, Office files, or images for automated OCR, classification, and summarization.
          </p>
          <DropzoneUpload onUploadSuccess={fetchStats} />
        </div>

        {/* Categories Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Document Categories
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              AI classified document distribution
            </p>

            <div className="space-y-3">
              {stats?.categoryDistribution && Object.keys(stats.categoryDistribution).length > 0 ? (
                Object.entries(stats.categoryDistribution).map(([category, count]) => {
                  const total = stats.completedDocuments || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <CategoryBadge category={category} />
                        <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-500">
                  No classified documents yet. Upload a document to view category insights.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/60">
            <Link
              to="/documents"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <span>Explore Documents Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100">Recent Ingestions</h2>
            <p className="text-xs text-slate-400">Recently processed intelligence records</p>
          </div>
          <Link
            to="/documents"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            View All ({stats?.totalDocuments || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-950/40 border-y border-slate-800/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Document Name</th>
                  <th className="px-4 py-3 font-semibold">File Type</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-slate-200">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="hover:text-indigo-400 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="truncate max-w-xs">{doc.fileName}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono uppercase">
                      {doc.fileName.split('.').pop() || 'FILE'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono">
                      {formatBytes(doc.fileSizeBytes)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={doc.processingStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-slate-400">
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition-colors"
                      >
                        Studio
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs">
            No documents found. Drag & drop a document above to get started!
          </div>
        )}
      </div>
    </div>
  );
};
