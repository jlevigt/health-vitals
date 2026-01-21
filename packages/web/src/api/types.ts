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
  category: "lipid_panel" | "glucose_metabolism" | "renal_function";
  series: TrendSeries[];
};

export interface Observation {
  id: string;
  name: string;
  value: string;
  unit: string;
  status: string;
  interpretation: string;
}

export interface Report {
  id: string;
  fileName: string;
  date: string;
  status: "processed" | "processing" | "failed";
  observationsCount: number;
}
