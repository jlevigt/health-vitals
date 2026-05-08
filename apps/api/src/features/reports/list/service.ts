import type { Database } from "@health-vitals/platform";
import { Report } from "./types.ts";

export class ListReportsService {
  constructor(private db: Database) {}

  async execute(userId: string): Promise<Report[]> {
    const query = `
      SELECT 
        r.id,
        r.file_id,
        r.collection_date,
        r.lab_name,
        f.original_filename as file_name,
        COUNT(o.id) as observations_count
      FROM reports r
      JOIN files f ON r.file_id = f.id
      LEFT JOIN observations o ON r.id = o.report_id
      WHERE f.user_id = $1
      GROUP BY r.id, f.original_filename
      ORDER BY r.created_at DESC
    `;

    const result = await this.db.query(query, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      file_id: row.file_id,
      fileName: row.file_name,
      date: row.collection_date instanceof Date 
          ? row.collection_date.toISOString().split('T')[0] 
          : row.collection_date,
      lab_name: row.lab_name,
      observationsCount: parseInt(row.observations_count, 10),
    }));
  }
}
