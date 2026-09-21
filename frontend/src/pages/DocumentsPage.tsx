import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { docsApi } from '../services/api';
import { DocumentRecord } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { DropzoneUpload } from '../components/DropzoneUpload';
import {
  Search,
  Download,
  Trash2,
  RotateCw,
  FileText,
  Upload,
  Plus,
  Loader2,
  ExternalLink,
  Filter,
} from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showUpload, setShowUpload] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await docsApi.list();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    const interval = setInterval(fetchDocs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      await docsApi.download(doc.id, doc.fileName);
    } catch (err) {
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this document and all associated AI insights?')) {
      return;
    }

    try {
      setActionLoading(id);
      await docsApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert('Failed to delete document.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReprocess = async (id: number) => {
    try {
      setActionLoading(id);
      await docsApi.reprocess(id);
      await fetchDocs();
    } catch (err) {
      alert('Failed to trigger reprocessing.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || doc.processingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Documents Hub</h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, inspect, download, and manage your processed intelligence repository.
          </p>
        </div>

        <button
          onClick={() => setShowUpload(!showUpload)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
        >
          {showUpload ? <Upload className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUpload ? 'Hide Uploader' : 'Upload Documents'}
        </button>
      </div>

      {/* Collapsible Upload Dropzone */}
      {showUpload && (
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl transition-all">
          <DropzoneUpload
            onUploadSuccess={() => {
              fetchDocs();
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
          {['ALL', 'Completed', 'Processing', 'Queued', 'Failed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-slate-800/80 overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800/80">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Document</th>
                  <th className="px-4 py-3.5 font-semibold">Format</th>
                  <th className="px-4 py-3.5 font-semibold">File Size</th>
                  <th className="px-4 py-3.5 font-semibold">AI Status</th>
                  <th className="px-4 py-3.5 font-semibold">Uploaded Date</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredDocs.map((doc) => {
                  const ext = doc.fileName.split('.').pop()?.toUpperCase() || 'FILE';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="font-semibold text-slate-200 hover:text-indigo-400 flex items-center gap-2.5"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="truncate max-w-xs sm:max-w-md font-medium text-slate-100">
                              {doc.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500">ID #{doc.id}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {ext}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 font-mono">
                        {formatBytes(doc.fileSizeBytes)}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={doc.processingStatus} />
                      </td>
                      <td className="px-4 py-4 text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            to={`/documents/${doc.id}`}
                            title="Open AI Studio"
                            className="p-1.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleDownload(doc)}
                            title="Download original file"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReprocess(doc.id)}
                            disabled={actionLoading === doc.id}
                            title="Re-run AI processing"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors cursor-pointer"
                          >
                            <RotateCw
                              className={`w-3.5 h-3.5 ${
                                actionLoading === doc.id ? 'animate-spin' : ''
                              }`}
                            />
                          </button>

                          <button
                            onClick={() => handleDelete(doc.id)}
                            disabled={actionLoading === doc.id}
                            title="Delete document"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            No documents matched your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
