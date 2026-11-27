import type { TrendPoint, TrendSeries } from "@health-vitals/contracts";
import { X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActiveDot,
  type BiomarkerStatus,
  CustomDot,
  CustomTooltip,
  computeYDomain,
  evaluatePointStatus,
  formatAxisDate,
  formatFallbackBiomarkerName,
  formatFullDate,
  formatNumericValue,
  formatReferenceRange,
  getStatusStyle,
} from "./TrendChart";

interface ChartFocusModalProps {
  series: TrendSeries | null;
  onClose: () => void;
}

interface MeasurementHistoryTableProps {
  points: TrendPoint[];
  unit: string;
  locale: string;
  statusLabels: Record<BiomarkerStatus, string>;
}

function formatTableReference(low: number | null, high: number | null): string {
  if (low !== null && high !== null) {
    return `${formatNumericValue(low)} – ${formatNumericValue(high)}`;
  }
  if (low !== null) {
    return `≥ ${formatNumericValue(low)}`;
  }
  if (high !== null) {
    return `≤ ${formatNumericValue(high)}`;
  }
  return "—";
}

const MeasurementHistoryTable: React.FC<MeasurementHistoryTableProps> = ({
  points,
  unit,
  locale,
  statusLabels,
}) => {
  const { t } = useTranslation("dashboard");
  const reversedPoints = [...points].reverse();

  return (
    <div className="border-t border-outline-variant pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2.5">
        {t("chart.historyTitle")}
      </h3>
      <div className="rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto max-h-56 overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-surface text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider border-b border-outline-variant">
              <tr>
                <th className="px-4 py-2">{t("chart.dateColumn")}</th>
                <th className="px-4 py-2 text-right">{t("chart.valueColumn")}</th>
                <th className="px-4 py-2">{t("chart.referenceColumn")}</th>
                <th className="px-4 py-2">{t("chart.statusColumn")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/70 bg-white">
              {reversedPoints.map((point) => {
                const status = evaluatePointStatus(
                  point.value,
                  point.reference_low,
                  point.reference_high,
                );
                const badge = getStatusStyle(status);
                return (
                  <tr key={`${point.date}-${point.value}`} className="hover:bg-surface/60">
                    <td className="px-4 py-2 text-xs font-medium text-on-surface tabular-nums">
                      {formatFullDate(point.date, locale)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-on-surface tabular-nums">
                      {formatNumericValue(point.value)}
                      {unit && (
                        <span className="ml-1 text-xs font-normal text-on-surface-variant">
                          {unit}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-on-surface-variant tabular-nums">
                      {formatTableReference(point.reference_low, point.reference_high)}
                    </td>
                    <td className="px-4 py-2">
                      {badge ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                          {statusLabels[status]}
                        </span>
                      ) : (
                        <span className="text-xs text-on-surface-variant">
                          {statusLabels.neutral}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ChartFocusModal: React.FC<ChartFocusModalProps> = ({ series, onClose }) => {
  const { t, i18n } = useTranslation("dashboard");

  useEffect(() => {
    if (!series) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [series, onClose]);

  if (!series) {
    return null;
  }

  const locale = i18n.language || "pt-BR";
  const { points, unit, canonical_name } = series;
  const displayName = t(`biomarkers.${canonical_name}`, {
    defaultValue: formatFallbackBiomarkerName(canonical_name),
  });
  const latestPoint = points.length > 0 ? points[points.length - 1] : null;
  const refLow =
    latestPoint?.reference_low ??
    points.find((p) => p.reference_low !== null)?.reference_low ??
    null;
  const refHigh =
    latestPoint?.reference_high ??
    points.find((p) => p.reference_high !== null)?.reference_high ??
    null;

  const latestStatus = latestPoint
    ? evaluatePointStatus(latestPoint.value, refLow, refHigh)
    : "neutral";
  const statusStyle = getStatusStyle(latestStatus);
  const statusLabels: Record<BiomarkerStatus, string> = {
    normal: t("chart.status.normal"),
    high: t("chart.status.high"),
    low: t("chart.status.low"),
    neutral: t("chart.status.neutral"),
  };
  const refRangeText = formatReferenceRange(refLow, refHigh, unit);
  const yDomain = computeYDomain(points, refLow, refHigh, 0.12);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chart-focus-title"
    >
      <button
        type="button"
        aria-label={t("chart.closeFocus")}
        onClick={onClose}
        className="fixed inset-0 w-full h-full cursor-default"
        tabIndex={-1}
      />

      <div className="relative z-10 w-full max-w-4xl max-h-[92dvh] overflow-y-auto bg-white rounded-2xl border border-outline-variant shadow-2xl p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2
                id="chart-focus-title"
                className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight"
              >
                {displayName}
              </h2>
              {statusStyle && (
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotClass}`} />
                  {statusLabels[latestStatus]}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">
              {t("chart.pointsCount", { count: points.length })}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t("chart.closeFocus")}
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary KPI Strip */}
        <div className="flex flex-wrap items-baseline justify-between gap-4 px-4 py-3 rounded-xl bg-surface border border-outline-variant">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-on-surface-variant">
              {t("chart.latestValue")}:
            </span>
            <span className="text-3xl font-bold text-on-surface tabular-nums leading-none">
              {latestPoint ? formatNumericValue(latestPoint.value) : "—"}
            </span>
            {unit && <span className="text-sm font-medium text-on-surface-variant">{unit}</span>}
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant tabular-nums">
            {refRangeText ? (
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-success-container/60 text-on-success-container border border-success-border">
                <span className="w-2.5 h-2.5 rounded-xs bg-success/30 border border-success" />
                {refRangeText}
              </span>
            ) : (
              <span>{t("chart.noReference")}</span>
            )}
          </div>
        </div>

        {/* Expanded Chart Canvas */}
        <div className="w-full h-[300px] sm:h-[380px] rounded-xl border border-outline-variant/80 bg-white p-3 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 16, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
                tick={{ fill: "#475569", fontSize: 12 }}
                tickFormatter={(value: string) =>
                  points.length <= 6 ? formatFullDate(value, locale) : formatAxisDate(value, locale)
                }
                dy={8}
                minTickGap={24}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fill: "#475569", fontSize: 12 }}
                domain={yDomain}
                tickCount={7}
              />
              <Tooltip
                content={<CustomTooltip unit={unit} locale={locale} statusLabels={statusLabels} />}
                cursor={{ stroke: "#94A3B8", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              {refLow !== null && refHigh !== null && (
                <ReferenceArea
                  y1={refLow}
                  y2={refHigh}
                  fill="#059669"
                  fillOpacity={0.08}
                  stroke="none"
                />
              )}
              {refLow !== null && (
                <ReferenceLine
                  y={refLow}
                  stroke="#059669"
                  strokeOpacity={0.55}
                  strokeDasharray="4 4"
                  label={{
                    value: formatNumericValue(refLow),
                    position: "insideBottomRight",
                    fill: "#047857",
                    fontSize: 11,
                  }}
                />
              )}
              {refHigh !== null && (
                <ReferenceLine
                  y={refHigh}
                  stroke="#059669"
                  strokeOpacity={0.55}
                  strokeDasharray="4 4"
                  label={{
                    value: formatNumericValue(refHigh),
                    position: "insideTopRight",
                    fill: "#047857",
                    fontSize: 11,
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0F766E"
                strokeWidth={2.5}
                dot={<CustomDot radius={5} />}
                activeDot={<ActiveDot radius={7} />}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chronological Measurement History */}
        <MeasurementHistoryTable
          points={points}
          unit={unit}
          locale={locale}
          statusLabels={statusLabels}
        />
      </div>
    </div>
  );
};
