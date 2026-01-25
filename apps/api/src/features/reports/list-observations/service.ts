import type { Database } from "@health-data/shared";
import { AppError } from "@health-data/shared";
import { Observation } from "./types.ts";

export class ListReportObservationsService {
  constructor(private db: Database) {}

  async execute(userId: string, reportId: string): Promise<Observation[]> {
    // 1. Verify report ownership via file relationship
    const reportRes = await this.db.query(
      `SELECT r.id FROM reports r
       JOIN files f ON r.file_id = f.id
       WHERE r.id = $1 AND f.user_id = $2`,
      [reportId, userId]
    );

    if (reportRes.rowCount === 0) {
      throw new AppError("Report not found or access denied.", 404);
    }

    // 2. Fetch observations
    const obsRes = await this.db.query(
      `SELECT 
        o.id, oc.code as category, od.canonical_name, o.raw_name, o.raw_value, o.raw_unit,
        o.normalized_value, od.base_unit, o.reference_low, o.reference_high
       FROM observations o
       JOIN observation_definitions od ON o.observation_id = od.id
       LEFT JOIN observation_categories oc ON od.category_id = oc.id
       WHERE o.report_id = $1
       ORDER BY oc.code, od.canonical_name`,
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
        value: row.raw_value,
        unit: row.raw_unit || row.base_unit || "",
        status: "final",
        interpretation,
      };
    });
  }
}
