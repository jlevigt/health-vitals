import { describe, expect, it, mock } from "bun:test";
import type { Database } from "@health-vitals/platform";
import { GetTrendsService } from "./service.ts";

describe("GetTrendsService (biomarker series merging)", () => {
  it("merges legacy Portuguese and English duplicate canonical names into one chronological series", async () => {
    const db = {
      query: mock(async () => ({
        rows: [
          {
            canonical_name: "hdl",
            raw_name: "HDL",
            unit: "mg/dL",
            collection_date: new Date("2024-02-22T00:00:00.000Z"),
            normalized_value: "52",
            reference_low: "40",
            reference_high: "60",
          },
          {
            canonical_name: "colesterol_hdl",
            raw_name: "Colesterol HDL",
            unit: "mg/dL",
            collection_date: new Date("2026-11-14T00:00:00.000Z"),
            normalized_value: "58",
            reference_low: "40",
            reference_high: "60",
          },
          {
            canonical_name: "ldl",
            raw_name: "LDL",
            unit: "mg/dL",
            collection_date: new Date("2024-02-22T00:00:00.000Z"),
            normalized_value: "110",
            reference_low: "0",
            reference_high: "100",
          },
          {
            canonical_name: "colesterol_ldl",
            raw_name: "Colesterol LDL",
            unit: "mg/dL",
            collection_date: new Date("2026-11-14T00:00:00.000Z"),
            normalized_value: "92",
            reference_low: "0",
            reference_high: "100",
          },
        ],
      })),
    } as unknown as Database;

    const service = new GetTrendsService(db);
    const response = await service.execute("user-1", "lipid_panel");

    expect(response.series).toHaveLength(2);

    const hdl = response.series.find((s) => s.canonical_name === "hdl_cholesterol");
    expect(hdl?.points).toHaveLength(2);
    expect(hdl?.points[0]?.value).toBe(52);
    expect(hdl?.points[1]?.value).toBe(58);

    const ldl = response.series.find((s) => s.canonical_name === "ldl_cholesterol");
    expect(ldl?.points).toHaveLength(2);
    expect(ldl?.points[0]?.value).toBe(110);
    expect(ldl?.points[1]?.value).toBe(92);
  });
});
