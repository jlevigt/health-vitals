export type TrendPoint = {
  date: string;
  value: number;
  reference_low: number | null;
  reference_high: number | null;
};

export type TrendSeries = {
  canonical_name: string;
  unit: string;
  points: TrendPoint[];
};

export type DashboardResponse = {
  category: string;
  series: TrendSeries[];
};
