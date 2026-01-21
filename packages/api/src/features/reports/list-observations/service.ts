import type { Pool } from "node_modules/@types/pg/index.js";
import { Observation } from "./types.ts";
import { AppError } from "@/shared/errors/app.error.ts";

export class ListReportObservationsService {
  constructor(private pool: Pool) {}

  async execute(userId: string, reportId: string): Promise<Observation[]> {
    // 1. Verify report ownership
    const reportRes = await this.pool.query(
      "SELECT id FROM reports WHERE id = $1 AND user_id = $2",
      [reportId, userId]
    );

    if (reportRes.rowCount === 0) {
      throw new AppError("Report not found or access denied.", 404);
    }

    // 2. Fetch observations
    const obsRes = await this.pool.query(
      `SELECT 
        id, category, canonical_name, raw_name, raw_value, raw_unit,
        normalized_value, base_unit, reference_low, reference_high,
        loinc_code, material
       FROM observations
       WHERE report_id = $1
       ORDER BY category, canonical_name`,
      [reportId]
    );

    return obsRes.rows.map((row) => {
      let interpretation = "Normal";
      const val = row.normalized_value ? parseFloat(row.normalized_value) : null;
      const low = row.reference_low ? parseFloat(row.reference_low) : null;
      const high = row.reference_high ? parseFloat(row.reference_high) : null;

      if (val !== null && low !== null && val < low) interpretation = "Low";
      if (val !== null && high !== null && val > high) interpretation = "High";

      return {
        id: row.id,
        name: row.raw_name || row.canonical_name,
        value: row.raw_value, // Using raw value for display, or could format normalized
        unit: row.raw_unit || row.base_unit || "",
        status: "final", // Placeholder as we don't track obs status individually yet
        interpretation,
      };
    });
  }
}
