import { AlertCircle, CheckCircle2, Clock, FileText, RefreshCw, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/api/client";
import { UploadModal } from "@/components/UploadModal";

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

export const FilesPage: React.FC = () => {
  const { t, i18n } = useTranslation(["files", "common"]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

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

      {/* Files Table Card */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Desktop Column Headers */}
        <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_200px_140px] gap-4 px-6 py-3 border-b border-outline-variant bg-surface text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          <div>{t("files:table.filename")}</div>
          <div>{t("files:table.uploadedAt")}</div>
          <div className="text-right">{t("files:table.status")}</div>
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
                className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_200px_140px] gap-3 sm:gap-4 px-6 py-4 items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg skeleton-shimmer shrink-0" />
                  <div className="h-4 w-52 max-w-full rounded-md skeleton-shimmer" />
                </div>
                <div className="h-3.5 w-32 rounded-md skeleton-shimmer" />
                <div className="sm:flex sm:justify-end">
                  <div className="h-6 w-24 rounded-full skeleton-shimmer" />
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
            {files.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_200px_140px] gap-2.5 sm:gap-4 px-5 sm:px-6 py-3.5 sm:items-center even:bg-surface/40 hover:bg-primary-soft/45 transition-colors"
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

                <div className="flex items-center justify-between sm:contents pl-12 sm:pl-0">
                  <span className="text-xs text-on-surface-variant tabular-nums">
                    {formatUploadedAt(file.created_at, locale)}
                  </span>
                  <div className="sm:flex sm:justify-end">
                    <StatusBadge status={file.status} />
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
    </div>
  );
};
