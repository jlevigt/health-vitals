import type { Pool } from "node_modules/@types/pg/index.js";
import { Report } from "./types.ts";

export class ListReportsService {
  constructor(private pool: Pool) {}

  async execute(userId: string): Promise<Report[]> {
    const query = `
      SELECT 
        r.id,
        r.file_name,
        r.collection_date,
        r.status,
        COUNT(o.id) as observations_count
      FROM reports r
      LEFT JOIN observations o ON r.id = o.report_id
      WHERE r.user_id = $1
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);

    return result.rows.map(row => ({
      id: row.id,
      fileName: row.file_name,
      date: row.collection_date instanceof Date 
          ? row.collection_date.toISOString().split('T')[0] 
          : row.collection_date,
      status: row.status,
      observationsCount: parseInt(row.observations_count, 10),
    }));
  }
}
