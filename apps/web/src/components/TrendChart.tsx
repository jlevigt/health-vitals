import type React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type TrendPoint, type TrendSeries } from "@health-vitals/contracts";

interface TrendChartProps {
  series: TrendSeries;
}

export const TrendChart: React.FC<TrendChartProps> = ({ series }) => {
  const { points, unit, canonical_name } = series;

  // Format canonical name for display
  const displayName = canonical_name
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Get reference range from the first point (assuming it's consistent for the series)
  const refLow = points[0]?.reference_low;
  const refHigh = points[0]?.reference_high;

  interface DotProps {
    cx?: number;
    cy?: number;
    payload?: TrendPoint;
  }

  const CustomDot = (props: DotProps) => {
    const { cx, cy, payload } = props;
    if (!payload || cx === undefined || cy === undefined) return null;
    const { value, reference_low, reference_high } = payload;

    let color = "#79747E"; // Default gray
    if (reference_low !== null && reference_high !== null) {
      if (value < reference_low || value > reference_high) {
        color = "#B3261E"; // Material Red 40 (Error)
      } else {
        color = "#146C2E"; // Forest Green (Success-ish)
      }
    }

    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="none" />;
  };

  const ActiveDot = (props: DotProps) => {
    const { cx, cy, payload } = props;
    if (!payload || cx === undefined || cy === undefined) return null;
    const { value, reference_low, reference_high } = payload;

    let color = "#79747E";
    if (reference_low !== null && reference_high !== null) {
      if (value < reference_low || value > reference_high) {
        color = "#B3261E";
      } else {
        color = "#146C2E";
      }
    }

    return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={2} />;
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-outline-variant flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-baseline mb-2">
        <h3 className="text-sm font-bold text-on-surface truncate">{displayName}</h3>
        <span className="text-[10px] font-medium text-on-surface-variant uppercase">{unit}</span>
      </div>

      <div className="flex-1 w-full min-h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E0EC" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#49454F", fontSize: 9 }}
              tickFormatter={(date) => date.split("-").slice(1).join("/")} // MM/DD
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#49454F", fontSize: 9 }}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "11px",
                padding: "8px",
              }}
              labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
            />
            {refLow !== null && refHigh !== null && (
              <ReferenceArea
                y1={refLow}
                y2={refHigh}
                fill="#F3F4F6"
                fillOpacity={0.5}
                stroke="none"
              />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#79747E"
              strokeWidth={1.5}
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
