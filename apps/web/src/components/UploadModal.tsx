import { type ClassValue, clsx } from "clsx";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { filesApi } from "@/api/files";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface QueuedFile {
  id: string;
  file: File;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(2)} MB`;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    if ("response" in err) {
      const response = (err as { response?: { data?: { message?: unknown } } }).response;
      if (typeof response?.data?.message === "string" && response.data.message.trim().length > 0) {
        return response.data.message;
      }
    }
    if ("message" in err && typeof (err as { message?: unknown }).message === "string") {
      const message = (err as { message: string }).message;
      if (message.trim().length > 0) {
        return message;
      }
    }
  }
  return fallback;
}

function createQueuedFiles(fileList: FileList): QueuedFile[] {
  return Array.from(fileList)
    .filter((f) => f.type === "application/pdf")
    .map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
    }));
}

interface QueuedFileListProps {
  files: QueuedFile[];
  uploading: boolean;
  completedCount: number;
  onRemove: (id: string) => void;
}

const QueuedFileList: React.FC<QueuedFileListProps> = ({
  files,
  uploading,
  completedCount,
  onRemove,
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 max-h-44 overflow-y-auto space-y-2 pr-1">
      {files.map((entry, idx) => {
        const isCompleted = uploading && idx < completedCount;
        const isCurrent = uploading && idx === completedCount;

        return (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 bg-surface rounded-xl border border-outline-variant text-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary-soft border border-primary-container text-primary flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{entry.file.name}</p>
                <p className="text-[11px] text-on-surface-variant tabular-nums">
                  {formatFileSize(entry.file.size)}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {!uploading && (
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  aria-label={`Remove ${entry.file.name}`}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-success" />}
              {isCurrent && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
              {uploading && !isCompleted && !isCurrent && (
                <span className="block w-2 h-2 rounded-full bg-outline mx-1" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function getUploadButtonLabel(count: number): string {
  if (count === 0) {
    return "Upload Files";
  }
  return `Upload ${count} ${count === 1 ? "File" : "Files"}`;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setQueuedFiles([]);
    setError(null);
    setSuccess(false);
    setUploading(false);
    setCompletedCount(0);
    setIsDragOver(false);
  }, []);

  const handleClose = () => {
    if (uploading) {
      return;
    }
    resetState();
    onClose();
  };

  const appendFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const pdfs = createQueuedFiles(fileList);
    if (pdfs.length > 0) {
      setQueuedFiles((prev) => [...prev, ...pdfs]);
      setError(null);
    } else {
      setError("Only PDF lab reports are supported.");
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      appendFiles(e.dataTransfer.files);
    },
    [appendFiles],
  );

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async () => {
    if (queuedFiles.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    setCompletedCount(0);

    try {
      const { files: uploadConfigs } = await filesApi.getUploadUrls(
        queuedFiles.map(({ file }) => ({
          original_filename: file.name,
          size_bytes: file.size,
          content_type: file.type,
        })),
      );

      for (let i = 0; i < queuedFiles.length; i++) {
        const entry = queuedFiles[i];
        const config = uploadConfigs[i];

        await filesApi.uploadFileToUrl(config.upload_url, entry.file);
        await filesApi.completeUpload(config.file_id);
        setCompletedCount(i + 1);
      }

      setSuccess(true);
      window.setTimeout(() => {
        onUploadComplete();
        resetState();
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setError(extractErrorMessage(err, "Failed to upload files. Please try again."));
      setUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const progressPercent =
    queuedFiles.length > 0 ? Math.round((completedCount / queuedFiles.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close upload dialog"
        onClick={handleClose}
        disabled={uploading}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] cursor-default"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
        className="relative z-10 w-full max-w-lg bg-white rounded-2xl border border-outline-variant shadow-2xl shadow-slate-950/20 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div>
            <h2 id="upload-modal-title" className="font-display text-lg font-bold text-on-surface">
              Upload Lab Reports
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              PDF documents are extracted and indexed automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-success-container border border-success-border text-success flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-on-surface">Upload complete</h3>
                <p className="text-sm text-on-surface-variant">
                  Your PDF reports have been queued for biomarker extraction.
                </p>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={onFileSelect}
                multiple
              />

              <button
                type="button"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "w-full border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
                  isDragOver
                    ? "border-primary bg-primary-soft"
                    : "border-outline bg-surface hover:border-primary hover:bg-primary-soft/50",
                  uploading && "opacity-60 pointer-events-none",
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors",
                    isDragOver
                      ? "bg-primary text-on-primary"
                      : "bg-primary-soft border border-primary-container text-primary",
                  )}
                >
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-on-surface">
                  Click to browse or drag PDF files here
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Supports clinical lab reports in PDF format (up to 10 MB each)
                </p>
              </button>

              {/* Upload Progress Bar */}
              {uploading && (
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">Uploading documents...</span>
                    <span className="font-semibold text-primary tabular-nums">
                      {completedCount} / {queuedFiles.length} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-variant overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(progressPercent, 8)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Selected Files List */}
              <QueuedFileList
                files={queuedFiles}
                uploading={uploading}
                completedCount={completedCount}
                onRemove={removeFile}
              />

              {error && (
                <div
                  role="alert"
                  className="mt-4 px-3.5 py-2.5 rounded-xl bg-error-container border border-error-border text-on-error-container flex items-start gap-2.5 text-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="bg-surface px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={queuedFiles.length === 0 || uploading}
              className="px-4 py-2 text-sm font-semibold text-on-primary bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 min-w-[120px] justify-center cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                getUploadButtonLabel(queuedFiles.length)
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
