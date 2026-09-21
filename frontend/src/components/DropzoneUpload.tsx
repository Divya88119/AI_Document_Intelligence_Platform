import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { docsApi } from '../services/api';

interface DropzoneUploadProps {
  onUploadSuccess: () => void;
}

export const DropzoneUpload: React.FC<DropzoneUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadStatus(null);

    let successCount = 0;
    let errorMessage = '';

    for (const file of files) {
      try {
        await docsApi.upload(file);
        successCount++;
      } catch (err: any) {
        errorMessage = err.response?.data?.detail || err.response?.data?.title || 'Upload failed.';
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      setUploadStatus({
        type: 'success',
        message: `Successfully uploaded ${successCount} document(s). Processing AI pipeline in background...`,
      });
      onUploadSuccess();
    } else {
      setUploadStatus({
        type: 'error',
        message: errorMessage || 'Failed to upload document. Please check file format and size.',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt,.csv,.json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {isUploading ? 'Uploading & Queuing for AI...' : 'Drag & drop documents here'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              or click to browse files from your computer
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
            {['PDF', 'DOCX', 'XLSX', 'PNG', 'JPG', 'TXT', 'CSV'].map((ext) => (
              <span
                key={ext}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                {ext}
              </span>
            ))}
            <span className="text-xs text-slate-500 ml-1">Up to 15 MB</span>
          </div>
        </div>
      </div>

      {uploadStatus && (
        <div
          className={`mt-4 p-4 rounded-xl text-sm flex items-center gap-3 border ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
              : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
          }`}
        >
          {uploadStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          )}
          <span>{uploadStatus.message}</span>
        </div>
      )}
    </div>
  );
};
