import type { ObservationDTO as Observation, ReportDTO as Report } from "@health-vitals/contracts";
import { type ClassValue, clsx } from "clsx";
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderUp,
  RefreshCw,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { api } from "@/api/client";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ITEMS_PER_PAGE = 10;
const OBS_PER_PAGE = 6;
const SKELETON_ROWS = ["rep-1", "rep-2", "rep-3", "rep-4", "rep-5", "rep-6"] as const;

function formatReferenceInterval(low: number | null, high: number | null): string {
  if (low !== null && high !== null) {
    return `${low} – ${high}`;
  }
  if (low !== null) {
    return `≥ ${low}`;
  }
  if (high !== null) {
    return `≤ ${high}`;
  }
  return "—";
}

const InterpretationPill: React.FC<{ interpretation: string | null }> = ({ interpretation }) => {
  const { t } = useTranslation("reports");

  if (!interpretation) {
    return <span className="text-xs text-on-surface-variant">—</span>;
  }

  const normalized = interpretation.trim().toLowerCase();
  if (normalized === "high" || normalized === "low" || normalized === "abnormal") {
    const label =
      normalized === "high"
        ? t("interpretations.high")
        : normalized === "low"
          ? t("interpretations.low")
          : interpretation;

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-error-container text-on-error-container border border-error-border">
        <AlertCircle className="w-3 h-3 text-error shrink-0" />
        {label}
      </span>
    );
  }

  if (normalized === "normal") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-success-container text-on-success-container border border-success-border">
        <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
        {t("interpretations.normal")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-variant text-on-surface-variant border border-outline-variant">
      {interpretation}
    </span>
  );
};

export const ReportsPage: React.FC = () => {
  const { t } = useTranslation(["reports", "common"]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setHasError(false);
    try {
      const response = await api.get<Report[]>("/reports");
      setReports(response.data);
    } catch (_err: unknown) {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const toggleReport = (reportId: string) => {
    setExpandedReportId((prev) => (prev === reportId ? null : reportId));
  };

  const totalPages = Math.max(1, Math.ceil(reports.length / ITEMS_PER_PAGE));
  const currentReports = reports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="flex flex-col space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            {t("reports:title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("reports:subtitle")}</p>
        </div>

        {!loading && !hasError && reports.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-outline-variant text-xs text-on-surface-variant self-start sm:self-auto">
            <span>{t("reports:totalReports")}</span>
            <span className="font-bold text-on-surface tabular-nums">{reports.length}</span>
          </div>
        )}
      </div>

      {/* Reports Card */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Desktop Column Headers */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,1fr)_120px_180px_150px_32px] gap-4 px-6 py-3 border-b border-outline-variant bg-surface text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          <div>{t("reports:table.reportName")}</div>
          <div>{t("reports:table.date")}</div>
          <div>{t("reports:table.lab")}</div>
          <div>{t("reports:table.observations")}</div>
          <div className="sr-only">{t("reports:table.observations")}</div>
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
                className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px_180px_150px_32px] gap-3 md:gap-4 px-6 py-4 items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg skeleton-shimmer shrink-0" />
                  <div className="h-4 w-48 max-w-full rounded-md skeleton-shimmer" />
                </div>
                <div className="h-3.5 w-20 rounded-md skeleton-shimmer" />
                <div className="h-3.5 w-28 rounded-md skeleton-shimmer" />
                <div className="h-6 w-24 rounded-full skeleton-shimmer" />
                <div className="hidden md:block h-4 w-4 rounded skeleton-shimmer" />
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
                {t("reports:error.title")}
              </h2>
              <p className="text-sm text-on-surface-variant max-w-md">
                {t("reports:error.message")}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchReports}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? t("common:status.loading") : t("reports:error.retryCta")}
            </button>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary-container text-primary flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-display text-base font-bold text-on-surface">
                {t("reports:empty.title")}
              </h2>
              <p className="text-sm text-on-surface-variant max-w-sm">
                {t("reports:empty.subtitle")}
              </p>
            </div>
            <Link
              to="/files"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold shadow-xs transition-colors"
            >
              <FolderUp className="w-4 h-4" />
              {t("reports:empty.uploadCta")}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {currentReports.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                isExpanded={expandedReportId === report.id}
                onToggle={() => toggleReport(report.id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !hasError && totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-outline-variant flex items-center justify-between bg-surface">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface bg-white border border-outline-variant hover:bg-surface-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {t("common:pagination.previous")}
            </button>
            <span className="text-xs font-medium text-on-surface-variant tabular-nums">
              {t("common:pagination.pageOf", { current: currentPage, total: totalPages })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-on-surface bg-white border border-outline-variant hover:bg-surface-variant rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {t("common:pagination.next")}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReportRowProps {
  report: Report;
  isExpanded: boolean;
  onToggle: () => void;
}

const ReportRow: React.FC<ReportRowProps> = ({ report, isExpanded, onToggle }) => {
  const { t } = useTranslation(["reports", "common"]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [hasObsError, setHasObsError] = useState(false);
  const [obsPage, setObsPage] = useState(1);
  const [fetched, setFetched] = useState(false);

  const loadObservations = useCallback(async () => {
    setObsLoading(true);
    setHasObsError(false);
    try {
      const res = await api.get<Observation[]>(`/reports/${report.id}/observations`);
      setObservations(res.data);
      setFetched(true);
    } catch (_err: unknown) {
      setHasObsError(true);
    } finally {
      setObsLoading(false);
    }
  }, [report.id]);

  useEffect(() => {
    if (isExpanded && !fetched && !obsLoading) {
      loadObservations();
    }
  }, [isExpanded, fetched, obsLoading, loadObservations]);

  const totalObsPages = Math.max(1, Math.ceil(observations.length / OBS_PER_PAGE));
  const currentObs = observations.slice((obsPage - 1) * OBS_PER_PAGE, obsPage * OBS_PER_PAGE);

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={cn(
          "w-full text-left flex flex-col md:grid md:grid-cols-[minmax(0,1fr)_120px_180px_150px_32px] gap-2.5 md:gap-4 px-5 sm:px-6 py-4 md:items-center transition-colors cursor-pointer",
          isExpanded ? "bg-primary-soft/70" : "bg-white hover:bg-surface",
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
              isExpanded
                ? "bg-primary text-on-primary border-primary"
                : "bg-primary-soft border-primary-container text-primary",
            )}
          >
            <FileText className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-on-surface truncate" title={report.fileName}>
            {report.fileName}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 md:pl-0 md:contents">
          <div className="text-xs font-medium text-on-surface-variant tabular-nums">
            {report.date}
          </div>

          <div className="flex items-center gap-1.5 text-sm text-on-surface min-w-0">
            <Building2 className="w-3.5 h-3.5 text-on-surface-variant shrink-0 md:hidden" />
            {report.lab_name ? (
              <span className="truncate" title={report.lab_name}>
                {report.lab_name}
              </span>
            ) : (
              <span className="text-xs text-on-surface-variant italic">
                {t("reports:unknownLab")}
              </span>
            )}
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-variant text-on-surface border border-outline-variant tabular-nums">
              {t("reports:observationsCount", { count: report.observationsCount })}
            </span>
          </div>

          <div className="ml-auto md:ml-0 flex justify-end text-on-surface-variant">
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-150",
                isExpanded && "rotate-180 text-primary",
              )}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="bg-surface px-4 sm:px-6 py-4 border-t border-outline-variant">
          <div className="bg-white rounded-xl border border-outline-variant overflow-hidden">
            <div className="px-4 py-2.5 border-b border-outline-variant bg-surface/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" />
                {t("reports:expanded.extractedObservations")}
              </span>
              {fetched && !hasObsError && (
                <span className="text-[11px] font-medium text-on-surface-variant tabular-nums">
                  {t("reports:expanded.totalCount", { count: observations.length })}
                </span>
              )}
            </div>

            {obsLoading ? (
              <div className="p-4 space-y-2.5">
                <div className="h-8 w-full rounded-lg skeleton-shimmer" />
                <div className="h-8 w-full rounded-lg skeleton-shimmer" />
                <div className="h-8 w-full rounded-lg skeleton-shimmer" />
              </div>
            ) : hasObsError ? (
              <div className="p-6 text-center space-y-2.5">
                <p className="text-sm text-on-error-container">
                  {t("reports:expanded.errorLoading")}
                </p>
                <button
                  type="button"
                  onClick={loadObservations}
                  disabled={obsLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary-hover text-on-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${obsLoading ? "animate-spin" : ""}`} />
                  {obsLoading ? t("common:status.loading") : t("common:actions.retry")}
                </button>
              </div>
            ) : observations.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider bg-surface border-b border-outline-variant">
                      <tr>
                        <th className="px-4 py-2.5">{t("reports:expanded.testName")}</th>
                        <th className="px-4 py-2.5 text-right">{t("reports:expanded.value")}</th>
                        <th className="px-4 py-2.5">{t("reports:expanded.unit")}</th>
                        <th className="px-4 py-2.5">{t("reports:expanded.reference")}</th>
                        <th className="px-4 py-2.5">{t("reports:expanded.interpretation")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/70">
                      {currentObs.map((obs) => (
                        <tr key={obs.id} className="hover:bg-surface/60 transition-colors">
                          <td className="px-4 py-2.5 font-medium text-on-surface">{obs.name}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-on-surface tabular-nums">
                            {obs.value}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant">
                            {obs.unit || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-on-surface-variant tabular-nums">
                            {formatReferenceInterval(obs.reference_low, obs.reference_high)}
                          </td>
                          <td className="px-4 py-2.5">
                            <InterpretationPill interpretation={obs.interpretation} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalObsPages > 1 && (
                  <div className="px-4 py-2.5 border-t border-outline-variant flex items-center justify-end gap-2 bg-surface/60">
                    <button
                      type="button"
                      onClick={() => setObsPage((p) => Math.max(1, p - 1))}
                      disabled={obsPage === 1}
                      aria-label={t("common:pagination.previous")}
                      className="p-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-medium text-on-surface-variant tabular-nums px-1">
                      {obsPage} / {totalObsPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setObsPage((p) => Math.min(totalObsPages, p + 1))}
                      disabled={obsPage === totalObsPages}
                      aria-label={t("common:pagination.next")}
                      className="p-1.5 rounded-lg border border-outline-variant bg-white text-on-surface hover:bg-surface-variant disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                {t("reports:expanded.noObservations")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
