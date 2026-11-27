import type { TrendPoint, TrendSeries } from "@health-vitals/contracts";
import type React from "react";
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

export type BiomarkerStatus = "normal" | "high" | "low" | "neutral";

interface TrendChartProps {
  series: TrendSeries;
}

const UPPERCASE_TOKENS: Record<string, string> = {
  ldl: "LDL",
  hdl: "HDL",
  vldl: "VLDL",
  hba1c: "HbA1c",
  egfr: "eGFR",
  gfr: "GFR",
  ast: "AST",
  alt: "ALT",
  tsh: "TSH",
  crp: "CRP",
  bun: "BUN",
};

export function evaluatePointStatus(
  value: number,
  refLow: number | null,
  refHigh: number | null,
): BiomarkerStatus {
  if (refLow === null && refHigh === null) {
    return "neutral";
  }
  if (refLow !== null && value < refLow) {
    return "low";
  }
  if (refHigh !== null && value > refHigh) {
    return "high";
  }
  return "normal";
}

function formatFallbackBiomarkerName(canonicalName: string): string {
  return canonicalName
    .split("_")
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower in UPPERCASE_TOKENS) {
        return UPPERCASE_TOKENS[lower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function formatNumericValue(value: number): string {
  return Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
}

function parseUtcDate(dateStr: string): Date | null {
  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return null;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day));
}

function formatAxisDate(dateStr: string, locale: string): string {
  const parsed = parseUtcDate(dateStr);
  if (!parsed) {
    return dateStr;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatFullDate(dateStr: string, locale: string): string {
  const parsed = parseUtcDate(dateStr);
  if (!parsed) {
    return dateStr;
  }
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatReferenceRange(
  refLow: number | null,
  refHigh: number | null,
  unit: string,
): string | null {
  const suffix = unit ? ` ${unit}` : "";
  if (refLow !== null && refHigh !== null) {
    return `Ref: ${formatNumericValue(refLow)} – ${formatNumericValue(refHigh)}${suffix}`;
  }
  if (refLow !== null) {
    return `Ref: ≥ ${formatNumericValue(refLow)}${suffix}`;
  }
  if (refHigh !== null) {
    return `Ref: ≤ ${formatNumericValue(refHigh)}${suffix}`;
  }
  return null;
}

function computeYDomain(
  points: TrendPoint[],
  refLow: number | null,
  refHigh: number | null,
): [number, number] {
  const values: number[] = points.map((p) => p.value);
  if (refLow !== null) {
    values.push(refLow);
  }
  if (refHigh !== null) {
    values.push(refHigh);
  }
  if (values.length === 0) {
    return [0, 100];
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const span = maxVal - minVal;
  const padding = span === 0 ? Math.max(Math.abs(maxVal) * 0.15, 1) : span * 0.18;

  const paddedMin = minVal >= 0 ? Math.max(0, minVal - padding) : minVal - padding;
  const paddedMax = maxVal + padding;

  const precision = span < 5 ? 10 : 1;
  return [
    Math.floor(paddedMin * precision) / precision,
    Math.ceil(paddedMax * precision) / precision,
  ];
}

function getStatusColor(status: BiomarkerStatus): string {
  if (status === "normal") {
    return "#059669";
  }
  if (status === "high" || status === "low") {
    return "#E11D48";
  }
  return "#64748B";
}

function getStatusStyle(status: BiomarkerStatus): {
  badgeClass: string;
  dotClass: string;
} | null {
  switch (status) {
    case "normal":
      return {
        badgeClass: "bg-success-container text-on-success-container border-success-border",
        dotClass: "bg-success",
      };
    case "high":
    case "low":
      return {
        badgeClass: "bg-error-container text-on-error-container border-error-border",
        dotClass: "bg-error",
      };
    default:
      return null;
  }
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: TrendPoint;
}

const CustomDot: React.FC<DotProps> = ({ cx, cy, payload }) => {
  if (!payload || cx === undefined || cy === undefined) {
    return null;
  }
  const status = evaluatePointStatus(payload.value, payload.reference_low, payload.reference_high);
  const color = getStatusColor(status);

  return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#FFFFFF" strokeWidth={1.5} />;
};

const ActiveDot: React.FC<DotProps> = ({ cx, cy, payload }) => {
  if (!payload || cx === undefined || cy === undefined) {
    return null;
  }
  const status = evaluatePointStatus(payload.value, payload.reference_low, payload.reference_high);
  const color = getStatusColor(status);

  return <circle cx={cx} cy={cy} r={6} fill={color} stroke="#FFFFFF" strokeWidth={2} />;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: TrendPoint }>;
  unit: string;
  locale: string;
  statusLabels: Record<BiomarkerStatus, string>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  unit,
  locale,
  statusLabels,
}) => {
  const point = payload?.[0]?.payload;
  if (!active || !point) {
    return null;
  }

  const status = evaluatePointStatus(point.value, point.reference_low, point.reference_high);
  const statusStyle = getStatusStyle(status);
  const refText = formatReferenceRange(point.reference_low, point.reference_high, unit);

  return (
    <div className="rounded-xl bg-white border border-outline-variant shadow-lg shadow-slate-900/10 px-3 py-2.5 text-xs min-w-[160px]">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-medium text-on-surface-variant tabular-nums">
          {formatFullDate(point.date, locale)}
        </span>
        {statusStyle && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotClass}`} />
            {statusLabels[status]}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold text-on-surface tabular-nums">
          {formatNumericValue(point.value)}
        </span>
        {unit && <span className="text-[11px] font-medium text-on-surface-variant">{unit}</span>}
      </div>

      {refText && (
        <p className="mt-1 pt-1 border-t border-outline-variant/70 text-[11px] text-on-surface-variant tabular-nums">
          {refText}
        </p>
      )}
    </div>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({ series }) => {
  const { t, i18n } = useTranslation("dashboard");
  const { points, unit, canonical_name } = series;
  const locale = i18n.language || "pt-BR";

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
  const yDomain = computeYDomain(points, refLow, refHigh);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-outline-variant shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-outline transition-colors flex flex-col h-full overflow-hidden">
      {/* Header: Name + Status Pill */}
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-display text-sm font-semibold text-on-surface truncate"
          title={displayName}
        >
          {displayName}
        </h3>
        {statusStyle && (
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.badgeClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dotClass}`} />
            {statusLabels[latestStatus]}
          </span>
        )}
      </div>

      {/* Latest Value & Reference Range */}
      <div className="mt-1.5 mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-on-surface tabular-nums leading-none">
            {latestPoint ? formatNumericValue(latestPoint.value) : "—"}
          </span>
          {unit && <span className="text-xs font-medium text-on-surface-variant">{unit}</span>}
        </div>

        {refRangeText ? (
          <span className="text-[11px] font-medium text-on-surface-variant tabular-nums">
            {refRangeText}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-on-surface-variant/75">
            {t("chart.noReference")}
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 w-full min-h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 10 }}
              tickFormatter={(value: string) => formatAxisDate(value, locale)}
              dy={6}
              minTickGap={16}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={40}
              tick={{ fill: "#64748B", fontSize: 10 }}
              domain={yDomain}
              tickCount={4}
            />
            <Tooltip
              content={<CustomTooltip unit={unit} locale={locale} statusLabels={statusLabels} />}
              cursor={{ stroke: "#CBD5E1", strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            {refLow !== null && refHigh !== null && (
              <ReferenceArea
                y1={refLow}
                y2={refHigh}
                fill="#059669"
                fillOpacity={0.07}
                stroke="none"
              />
            )}
            {refLow !== null && (
              <ReferenceLine
                y={refLow}
                stroke="#059669"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            )}
            {refHigh !== null && (
              <ReferenceLine
                y={refHigh}
                stroke="#059669"
                strokeOpacity={0.35}
                strokeDasharray="3 3"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0F766E"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={<ActiveDot />}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
