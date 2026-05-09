import { z } from "zod";

/**
 * A single data point in a trend series
 */
export const trendPointSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  value: z.number(),
  reference_low: z.number().nullable(),
  reference_high: z.number().nullable(),
});

export type TrendPoint = z.infer<typeof trendPointSchema>;

/**
 * A named series of data points (e.g. "Glucose")
 */
export const trendSeriesSchema = z.object({
  canonical_name: z.string(),
  unit: z.string(),
  points: z.array(trendPointSchema),
});

export type TrendSeries = z.infer<typeof trendSeriesSchema>;

/**
 * Response for GET /dashboard/trends
 */
export const dashboardResponseSchema = z.object({
  category: z.string(),
  series: z.array(trendSeriesSchema),
});

export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
