import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  File
} from "lucide-react";
import { api } from "../../api/client";
import { UploadModal } from "../../components/UploadModal";




interface FileItem {
  id: string;
  filename: string;
  status: 'CREATED' | 'QUEUED' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED_RETRYABLE' | 'FAILED_TERMINAL';
  created_at: string;
}

export const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get<{ files: FileItem[] }>("/files");
      // Ensure files is always an array
      setFiles(response.data?.files || []);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch files", err);
      // Don't show error for 404 (just means no files yet if API behaves that way) or handle gracefully
      if (err.response?.status !== 404) {
        setError("Failed to load files. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: FileItem['status']) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <div className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase border border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </div>
        );
      case 'PROCESSING':
      case 'QUEUED':
        return (
          <div className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase border border-blue-200 flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 animate-pulse" /> Processing
          </div>
        );
      case 'FAILED_RETRYABLE':
      case 'FAILED_TERMINAL':
        return (
          <div className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase border border-red-200 flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Failed
          </div>
        );
      default:
        return (
          <div className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase border border-gray-200 flex items-center gap-1 w-fit">
             <Clock className="w-3 h-3" /> Pending
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="shrink-0 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Files</h1>
          <p className="text-sm text-on-surface-variant">Manage your uploaded documents and track processing status.</p>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Upload Files
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-outline-variant shadow-sm flex flex-col">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 border-b border-outline-variant bg-surface-variant/20 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
          <div>Filename</div>
          <div>Uploaded At</div>
          <div className="text-center">Status</div>
        </div>

        {/* Table Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-12 text-center text-error flex flex-col items-center gap-2">
              <AlertCircle className="w-12 h-12" />
              <p>{error}</p>
              <button onClick={fetchFiles} className="text-sm underline hover:text-red-700">Retry</button>
            </div>
          ) : files.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant opacity-60 flex flex-col items-center gap-2">
              <FileText className="w-12 h-12" />
              <p>No files uploaded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {files.map((file) => (
                <div key={file.id} className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-4 items-center hover:bg-surface-variant/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-secondary-container rounded-lg text-on-secondary-container">
                      <File className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium text-on-surface truncate">{file.filename}</span>
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {new Date(file.created_at).toLocaleDateString()} {new Date(file.created_at).toLocaleTimeString()}
                  </div>
                  <div className="flex justify-center">
                     {getStatusBadge(file.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadComplete={() => {
          fetchFiles();
        }} 
      />
    </div>
  );
};
