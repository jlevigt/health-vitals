import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/api/client";
import { filesApi } from "@/api/files";
import { SortButton } from "@/components/SortButton";
import { UploadModal } from "@/components/UploadModal";
import { type FileSortField, type SortDirection, sortFiles } from "@/utils/tableSort";

interface FileItem {
  id: string;
  filename: string;
  status:
    | "CREATED"
    | "QUEUED"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED_RETRYABLE"
    | "FAILED_TERMINAL";
  created_at: string;
}

const SKELETON_ROWS = ["file-sk-1", "file-sk-2", "file-sk-3", "file-sk-4", "file-sk-5"] as const;

function getErrorStatus(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "response" in err) {
    const status = (err as { response?: { status?: unknown } }).response?.status;
    if (typeof status === "number") {
      return status;
    }
  }
  return null;
}

function formatUploadedAt(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return `${date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

const StatusBadge: React.FC<{ status: FileItem["status"] }> = ({ status }) => {
  const { t } = useTranslation("files");

  switch (status) {
    case "SUCCEEDED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-container text-on-success-container border border-success-border text-xs font-semibold w-fit">
          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
          {t("status.completed")}
        </span>
      );
    case "PROCESSING":
    case "QUEUED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-container text-on-warning-container border border-warning-border text-xs font-semibold w-fit">
          <Clock className="w-3.5 h-3.5 text-warning animate-pulse shrink-0" />
          {t("status.processing")}
        </span>
      );
    case "FAILED_RETRYABLE":
    case "FAILED_TERMINAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container text-on-error-container border border-error-border text-xs font-semibold w-fit">
          <AlertCircle className="w-3.5 h-3.5 text-error shrink-0" />
          {t("status.failed")}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant border border-outline-variant text-xs font-semibold w-fit">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {t("status.pending")}
        </span>
      );
  }
};

interface DeleteFileModalProps {
  file: FileItem | null;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteFileModal: React.FC<DeleteFileModalProps> = ({
  file,
  deleting,
  error,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation(["files", "common"]);

  useEffect(() => {
    if (!file || deleting) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [file, deleting, onCancel]);

  if (!file) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-file-title"
    >
      <button
        type="button"
        aria-label={t("common:actions.cancel")}
        onClick={() => {
          if (!deleting) {
            onCancel();
          }
        }}
        className="fixed inset-0 w-full h-full cursor-default"
        tabIndex={-1}
      />

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl border border-outline-variant shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-error-container border border-error-border text-error flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h2 id="delete-file-title" className="font-display text-base font-bold text-on-surface">
              {t("files:delete.confirmTitle")}
            </h2>
            <p className="text-sm text-on-surface-variant break-words">
              {t("files:delete.confirmDescription", { filename: file.filename })}
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-xl bg-error-container border border-error-border px-3.5 py-2.5 text-xs font-medium text-on-error-container"
          >
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface bg-white border border-outline-variant hover:bg-surface-variant transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t("common:actions.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-error hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("files:delete.deleting")}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {t("files:delete.confirmAction")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const FilesPage: React.FC = () => {
  const { t, i18n } = useTranslation(["files", "common"]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortField, setSortField] = useState<FileSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const locale = i18n.language || "pt-BR";

  const fetchFiles = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await api.get<{ files: FileItem[] }>("/files");
      setFiles(response.data?.files || []);
      setHasError(false);
    } catch (err: unknown) {
      if (getErrorStatus(err) === 404) {
        setFiles([]);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles(false);
  }, [fetchFiles]);

  const handleSort = (field: FileSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "filename" ? "asc" : "desc");
    }
  };

  const sortedFiles = useMemo(
    () => sortFiles(files, sortField, sortDirection, locale),
    [files, sortField, sortDirection, locale],
  );

  const handleConfirmDelete = async () => {
    if (!fileToDelete) {
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await filesApi.deleteFile(fileToDelete.id);
      setFiles((prev) => prev.filter((item) => item.id !== fileToDelete.id));
      setFileToDelete(null);
    } catch (_err: unknown) {
      setDeleteError(t("files:delete.error"));
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseDeleteModal = useCallback(() => {
    setFileToDelete(null);
    setDeleteError(null);
  }, []);

  return (
    <div className="flex flex-col space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            {t("files:title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("files:subtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchFiles(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-surface-variant text-on-surface border border-outline-variant rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            {t("files:refreshButton")}
          </button>

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {t("files:uploadButton")}
          </button>
        </div>
      </div>

      {/* Mobile Sort Controls */}
      {!loading && !hasError && files.length > 1 && (
        <div className="flex sm:hidden items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 bg-white border border-outline-variant rounded-xl">
            <SortButton
              label={t("files:table.filename")}
              active={sortField === "filename"}
              direction={sortDirection}
              onClick={() => handleSort("filename")}
              className="px-2.5 py-1.5 rounded-lg"
            />
            <SortButton
              label={t("files:table.uploadedAt")}
              active={sortField === "created_at"}
              direction={sortDirection}
              onClick={() => handleSort("created_at")}
              className="px-2.5 py-1.5 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Files Table Card */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Desktop Column Headers */}
        <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_200px_132px_52px] gap-4 px-6 py-3 border-b border-outline-variant bg-surface text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider items-center">
          <div>
            <SortButton
              label={t("files:table.filename")}
              active={sortField === "filename"}
              direction={sortDirection}
              onClick={() => handleSort("filename")}
            />
          </div>
          <div>
            <SortButton
              label={t("files:table.uploadedAt")}
              active={sortField === "created_at"}
              direction={sortDirection}
              onClick={() => handleSort("created_at")}
            />
          </div>
          <div className="text-right">{t("files:table.status")}</div>
          <div className="text-right">{t("files:table.actions")}</div>
        </div>

        {/* Body */}
        {loading ? (
          <div
            role="status"
            aria-label={t("common:status.loading")}
            className="divide-y divide-outline-variant"
          >
            {SKELETON_ROWS.map((key) => (
              <div
                key={key}
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px_132px_52px] gap-3 sm:gap-4 px-6 py-4 items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg skeleton-shimmer shrink-0" />
                  <div className="h-4 w-52 max-w-full rounded-md skeleton-shimmer" />
                </div>
                <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
                <div className="sm:flex sm:justify-end">
                  <div className="h-6 w-24 rounded-full skeleton-shimmer" />
                </div>
                <div className="hidden sm:flex sm:justify-end">
                  <div className="h-8 w-8 rounded-lg skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        ) : hasError ? (
          <div className="p-12 text-center flex flex-col items-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-error-container border border-error-border text-error flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-on-surface">
                {t("files:error.title")}
              </h2>
              <p className="text-sm text-on-surface-variant">{t("files:error.message")}</p>
            </div>
            <button
              type="button"
              onClick={() => fetchFiles(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? t("common:status.loading") : t("files:error.retryCta")}
            </button>
          </div>
        ) : files.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary-container text-primary flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-on-surface">
                {t("files:empty.title")}
              </h2>
              <p className="text-sm text-on-surface-variant max-w-sm">
                {t("files:empty.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              {t("files:empty.uploadCta")}
            </button>
          </div>
        ) : (
          <div
            className={`divide-y divide-outline-variant transition-opacity duration-200 ${
              refreshing ? "opacity-55 pointer-events-none" : "opacity-100"
            }`}
          >
            {sortedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_200px_132px_52px] gap-2.5 sm:gap-4 px-5 sm:px-6 py-3.5 sm:items-center even:bg-surface/40 hover:bg-primary-soft/45 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary-soft border border-primary-container text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span
                    className="text-sm font-medium text-on-surface truncate"
                    title={file.filename}
                  >
                    {file.filename}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 sm:contents pl-12 sm:pl-0">
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {formatUploadedAt(file.created_at, locale)}
                  </span>
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="sm:flex sm:justify-end">
                      <StatusBadge status={file.status} />
                    </div>
                    <div className="sm:flex sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError(null);
                          setFileToDelete(file);
                        }}
                        aria-label={`${t("files:delete.button")}: ${file.filename}`}
                        title={t("files:delete.button")}
                        className="p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/70 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={() => {
          fetchFiles(true);
        }}
      />

      <DeleteFileModal
        file={fileToDelete}
        deleting={deleting}
        error={deleteError}
        onCancel={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
