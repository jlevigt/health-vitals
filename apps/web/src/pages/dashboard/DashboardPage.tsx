import type { DashboardResponse, TrendSeries } from "@health-vitals/contracts";
import { type ClassValue, clsx } from "clsx";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FolderUp,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { api } from "@/api/client";
import { evaluatePointStatus, TrendChart } from "@/components/TrendChart";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type DashboardCategory = "lipid_panel" | "glucose_metabolism" | "renal_function";

const CATEGORIES: readonly DashboardCategory[] = [
  "lipid_panel",
  "glucose_metabolism",
  "renal_function",
];

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const;

interface PanelSummary {
  tracked: number;
  inRange: number;
  outOfRange: number;
}

function summarizePanel(seriesList: TrendSeries[]): PanelSummary {
  let inRange = 0;
  let outOfRange = 0;

  for (const series of seriesList) {
    const latest = series.points[series.points.length - 1];
    if (!latest) {
      continue;
    }
    const status = evaluatePointStatus(latest.value, latest.reference_low, latest.reference_high);
    if (status === "normal") {
      inRange += 1;
    } else if (status === "high" || status === "low") {
      outOfRange += 1;
    }
  }

  return {
    tracked: seriesList.length,
    inRange,
    outOfRange,
  };
}

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation("dashboard");
  const [category, setCategory] = useState<DashboardCategory>("lipid_panel");
  const [data, setData] = useState<TrendSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = useCallback(async (cat: DashboardCategory) => {
    setLoading(true);
    setHasError(false);
    try {
      const response = await api.get<DashboardResponse>(`/dashboard/${cat}`);
      setData(response.data.series);
    } catch (_err: unknown) {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(category);
  }, [category, fetchData]);

  const summary = useMemo(() => summarizePanel(data), [data]);

  return (
    <div className="flex flex-col space-y-6 pb-6">
      {/* Page Header & Segmented Category Control */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-on-surface-variant">{t("subtitle")}</p>
        </div>

        <div
          role="tablist"
          aria-label={t("title")}
          className="inline-flex flex-wrap p-1 bg-surface-variant border border-outline-variant rounded-xl self-start lg:self-auto"
        >
          {CATEGORIES.map((catId) => {
            const isActive = category === catId;
            return (
              <button
                key={catId}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setCategory(catId)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs sm:text-sm transition-all cursor-pointer",
                  isActive
                    ? "bg-white text-primary font-semibold shadow-xs"
                    : "text-on-surface-variant font-medium hover:text-on-surface",
                )}
              >
                {t(`categories.${catId}`)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compact Panel Summary Strip */}
      {!loading && !hasError && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-outline-variant px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-soft border border-primary-container flex items-center justify-center text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                {t("summary.trackedBiomarkers")}
              </span>
            </div>
            <span className="text-lg font-bold text-on-surface tabular-nums">
              {summary.tracked}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success-container border border-success-border flex items-center justify-center text-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                {t("summary.inRange")}
              </span>
            </div>
            <span className="text-lg font-bold text-on-success-container tabular-nums">
              {summary.inRange}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-outline-variant px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg border flex items-center justify-center",
                  summary.outOfRange > 0
                    ? "bg-error-container border-error-border text-error"
                    : "bg-surface-variant border-outline-variant text-on-surface-variant",
                )}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-on-surface-variant">
                {t("summary.outOfRange")}
              </span>
            </div>
            <span
              className={cn(
                "text-lg font-bold tabular-nums",
                summary.outOfRange > 0 ? "text-on-error-container" : "text-on-surface-variant",
              )}
            >
              {summary.outOfRange}
            </span>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      {loading ? (
        <div
          role="status"
          aria-label={t("loading")}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="h-[270px] bg-white p-5 rounded-2xl border border-outline-variant flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-4 w-32 rounded-md skeleton-shimmer" />
                  <div className="h-5 w-16 rounded-full skeleton-shimmer" />
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="h-7 w-24 rounded-md skeleton-shimmer" />
                  <div className="h-3.5 w-28 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-[145px] w-full rounded-xl skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : hasError ? (
        <div className="bg-white rounded-2xl border border-outline-variant p-10 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-error-container border border-error-border text-error flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-on-surface">{t("error.title")}</h2>
            <p className="text-sm text-on-surface-variant max-w-md">{t("error.message")}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchData(category)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t("error.retryCta")}
          </button>
        </div>
      ) : data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((series) => (
            <div key={series.canonical_name} className="h-[270px]">
              <TrendChart series={series} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-outline-variant p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft border border-primary-container text-primary flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-on-surface">{t("empty.title")}</h2>
            <p className="text-sm text-on-surface-variant max-w-md">{t("empty.subtitle")}</p>
          </div>
          <Link
            to="/files"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-on-primary rounded-xl text-sm font-semibold shadow-xs transition-colors"
          >
            <FolderUp className="w-4 h-4" />
            {t("empty.uploadCta")}
          </Link>
        </div>
      )}
    </div>
  );
};
