import type { Database } from "@health-vitals/platform";
import { DashboardResponse, TrendSeries } from "./types.ts";

export class GetTrendsService {
  constructor(private db: Database) {}

  async execute(userId: string, category: string): Promise<DashboardResponse> {
    const query = `
      SELECT 
        od.canonical_name,
        od.base_unit as unit,
        r.collection_date,
        o.normalized_value,
        o.reference_low,
        o.reference_high
      FROM observations o
      JOIN observation_definitions od ON o.observation_id = od.id
      JOIN observation_categories oc ON od.category_id = oc.id
      JOIN reports r ON o.report_id = r.id
      JOIN files f ON r.file_id = f.id
      WHERE f.user_id = $1 
        AND oc.code = $2
        AND o.normalized_value IS NOT NULL
      ORDER BY r.collection_date ASC
    `;

    const result = await this.db.query(query, [userId, category]);

    const seriesMap = new Map<string, TrendSeries>();

    for (const row of result.rows) {
      if (!seriesMap.has(row.canonical_name)) {
        seriesMap.set(row.canonical_name, {
          canonical_name: row.canonical_name,
          unit: row.unit || '',
          points: [],
        });
      }

      const series = seriesMap.get(row.canonical_name)!;
      
      if (!series.unit && row.unit) {
          series.unit = row.unit;
      }

      series.points.push({
        date: row.collection_date instanceof Date 
          ? row.collection_date.toISOString().split('T')[0] 
          : row.collection_date,
        value: parseFloat(row.normalized_value),
        reference_low: row.reference_low ? parseFloat(row.reference_low) : null,
        reference_high: row.reference_high ? parseFloat(row.reference_high) : null,
      });
    }

    return {
      category,
      series: Array.from(seriesMap.values()),
    };
  }
}
