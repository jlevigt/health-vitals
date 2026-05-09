import { z } from "zod";

/**
 * Report summary in list
 */
export const reportSchema = z.object({
  id: z.string().uuid(),
  file_id: z.string().uuid(),
  fileName: z.string(),
  date: z.string(), // YYYY-MM-DD
  lab_name: z.string().nullable(),
  observationsCount: z.number(),
});

export type ReportDTO = z.infer<typeof reportSchema>;

/**
 * Single observation in a report
 */
export const observationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  value: z.string(),
  unit: z.string().nullable(),
  interpretation: z.string().nullable(),
  category: z.string(),
  reference_low: z.number().nullable(),
  reference_high: z.number().nullable(),
});

export type ObservationDTO = z.infer<typeof observationSchema>;

/**
 * Response for GET /reports
 */
export const listReportsResponseSchema = z.array(reportSchema);
export type ListReportsResponse = z.infer<typeof listReportsResponseSchema>;

/**
 * Response for GET /reports/:id/observations
 */
export const listObservationsResponseSchema = z.array(observationSchema);
export type ListObservationsResponse = z.infer<typeof listObservationsResponseSchema>;
