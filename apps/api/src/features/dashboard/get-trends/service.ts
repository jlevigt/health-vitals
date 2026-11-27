import type { DashboardResponse, TrendPoint, TrendSeries } from "@health-vitals/contracts";
import { type Database, normalizeBiomarker } from "@health-vitals/platform";

interface RawTrendRow {
  canonical_name: string;
  raw_name: string;
  unit: string | null;
  collection_date: Date | string;
  normalized_value: string;
  reference_low: string | null;
  reference_high: string | null;
}

function toTrendPoint(row: RawTrendRow): TrendPoint {
  const dateStr =
    row.collection_date instanceof Date
      ? row.collection_date.toISOString().split("T")[0]
      : String(row.collection_date);

  return {
    date: dateStr,
    value: Number.parseFloat(row.normalized_value),
    reference_low: row.reference_low !== null ? Number.parseFloat(row.reference_low) : null,
    reference_high: row.reference_high !== null ? Number.parseFloat(row.reference_high) : null,
  };
}

function upsertSeriesRow(seriesMap: Map<string, TrendSeries>, row: RawTrendRow): void {
  const normalized = normalizeBiomarker({
    canonicalName: row.canonical_name,
    rawName: row.raw_name,
  });
  const key = normalized.canonicalName;

  let series = seriesMap.get(key);
  if (!series) {
    series = {
      canonical_name: key,
      unit: row.unit || "",
      points: [],
    };
    seriesMap.set(key, series);
  } else if (!series.unit && row.unit) {
    series.unit = row.unit;
  }

  const point = toTrendPoint(row);
  const existingIdx = series.points.findIndex((p) => p.date === point.date);
  if (existingIdx >= 0) {
    series.points[existingIdx] = point;
  } else {
    series.points.push(point);
  }
}

export class GetTrendsService {
  constructor(private db: Database) {}

  async execute(userId: string, category: string): Promise<DashboardResponse> {
    const query = `
      SELECT 
        od.canonical_name,
        o.raw_name,
        COALESCE(NULLIF(o.raw_unit, ''), od.base_unit) as unit,
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

    const result = await this.db.query<RawTrendRow>(query, [userId, category]);
    const seriesMap = new Map<string, TrendSeries>();

    for (const row of result.rows) {
      upsertSeriesRow(seriesMap, row);
    }

    for (const series of seriesMap.values()) {
      series.points.sort((a, b) => a.date.localeCompare(b.date));
    }

    return {
      category,
      series: Array.from(seriesMap.values()),
    };
  }
}
