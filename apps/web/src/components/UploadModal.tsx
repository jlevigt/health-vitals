import { clsx } from "clsx";
import { AlertCircle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { filesApi } from "@/api/files";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setFiles([]);
    setError(null);
    setSuccess(false);
    setUploading(false);
    setCurrentFileIndex(0);
  }, []);

  const handleClose = () => {
    if (uploading) {
      return;
    }
    resetState();
    onClose();
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf",
      );
      if (droppedFiles.length > 0) {
        setFiles((prev) => [...prev, ...droppedFiles]);
        setError(null);
      } else {
        setError("Only PDF files are allowed.");
      }
    }
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter((f) => f.type === "application/pdf");
      if (selectedFiles.length > 0) {
        setFiles((prev) => [...prev, ...selectedFiles]);
        setError(null);
      } else {
        setError("Only PDF files are allowed.");
      }

      // Reset input value so same files can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setError(null);
    setCurrentFileIndex(0);

    try {
      // 1. Get Upload URLs for ALL files at once
      const { files: uploadConfigs } = await filesApi.getUploadUrls(
        files.map((f) => ({
          original_filename: f.name,
          size_bytes: f.size,
          content_type: f.type,
        })),
      );

      // 2. Upload each file sequentially (or parallel limited)
      // For simplicity/robustness, we'll do sequential here but update UI
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i + 1); // 1-based index for UI
        const file = files[i];
        const config = uploadConfigs[i];

        // Upload to S3
        await filesApi.uploadFileToUrl(config.upload_url, file);

        // Confirm Upload
        await filesApi.completeUpload(config.file_id);
      }

      setSuccess(true);
      setTimeout(() => {
        onUploadComplete();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to upload files. Please try again.");
      setUploading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Upload Reports</h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            disabled={uploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-medium text-gray-900 mb-2">Upload Complete!</h4>
              <p className="text-gray-500">Your reports are being processed.</p>
            </div>
          ) : (
            <>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200",
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-gray-300 hover:border-primary hover:bg-gray-50",
                  uploading && "opacity-50 pointer-events-none",
                )}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="application/pdf"
                  onChange={onFileSelect}
                  multiple
                />

                <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500">PDF files only (max 10MB)</p>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="mt-4 max-h-40 overflow-y-auto space-y-2 pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm animate-in slide-in-from-bottom-1"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate max-w-[200px] text-gray-700">{file.name}</span>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {uploading && idx < currentFileIndex && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {uploading && idx >= currentFileIndex && (
                        <div className="w-4 h-4 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={uploading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading ({currentFileIndex}/{files.length})
                </>
              ) : (
                `Upload ${files.length > 0 ? files.length : ""} File${files.length !== 1 ? "s" : ""}`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
