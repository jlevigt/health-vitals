import { describe, expect, it } from "bun:test";
import {
  DEFAULT_EXAM_EXTRACTION_MODEL,
  ExamExtractionModel,
  ExamExtractionModelSchema,
  GEMINI_MODEL_QUOTAS,
  LLMProviderType,
  LLMProviderTypeSchema,
  LLMResultSchema,
} from "../llm.ts";

describe("LLM Contracts", () => {
  describe("LLMProviderTypeSchema", () => {
    it("should accept valid provider types", () => {
      expect(LLMProviderTypeSchema.parse("google")).toBe(LLMProviderType.GOOGLE);
      expect(LLMProviderTypeSchema.parse("local")).toBe(LLMProviderType.LOCAL);
      expect(LLMProviderTypeSchema.parse("mock")).toBe(LLMProviderType.MOCK);
    });

    it("should reject unsupported provider types", () => {
      expect(() => LLMProviderTypeSchema.parse("openai")).toThrow();
      expect(() => LLMProviderTypeSchema.parse("gemini")).toThrow();
      expect(() => LLMProviderTypeSchema.parse("")).toThrow();
    });
  });

  describe("ExamExtractionModel & GEMINI_MODEL_QUOTAS", () => {
    it("should default to gemini-3.5-flash-lite", () => {
      expect(DEFAULT_EXAM_EXTRACTION_MODEL).toBe("gemini-3.5-flash-lite");
      expect(DEFAULT_EXAM_EXTRACTION_MODEL).toBe(ExamExtractionModel.GEMINI_3_5_FLASH_LITE);
    });

    it("should accept all 7 active text-out models with RPD > 0", () => {
      const validModels: ExamExtractionModel[] = [
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.6-flash",
        "gemini-3-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
      ];

      expect(Object.values(ExamExtractionModel)).toEqual(validModels);

      for (const model of validModels) {
        expect(ExamExtractionModelSchema.safeParse(model).success).toBe(true);
      }
    });

    it("should reject deprecated or 0-RPD models", () => {
      const excludedModels = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-2.5-pro",
        "gemini-3.1-pro",
        "gemini-4-argon",
        "unknown-model",
      ];

      for (const model of excludedModels) {
        expect(ExamExtractionModelSchema.safeParse(model).success).toBe(false);
      }
    });

    it("should define valid non-zero quotas (RPM, TPM, RPD) for every ExamExtractionModel", () => {
      for (const model of Object.values(ExamExtractionModel)) {
        const quota = GEMINI_MODEL_QUOTAS[model];
        expect(quota).toBeDefined();
        expect(quota.rpm).toBeGreaterThan(0);
        expect(quota.tpm).toBeGreaterThan(0);
        expect(quota.rpd).toBeGreaterThan(0);
      }

      // Tier 1 (500 RPD, 15 RPM)
      expect(GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_3_5_FLASH_LITE]).toEqual({
        rpm: 15,
        tpm: 250_000,
        rpd: 500,
      });
      expect(GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_3_1_FLASH_LITE]).toEqual({
        rpm: 15,
        tpm: 250_000,
        rpd: 500,
      });

      // Tier 2 (20 RPD)
      expect(GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_3_8_FLASH]).toEqual({
        rpm: 5,
        tpm: 250_000,
        rpd: 20,
      });
      expect(GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_2_5_FLASH_LITE]).toEqual({
        rpm: 10,
        tpm: 250_000,
        rpd: 20,
      });
    });
  });

  describe("LLMResultSchema", () => {
    it("should validate a well-formed extraction result", () => {
      const validPayload = {
        collection_date: "2026-01-15",
        lab_name: "Central Lab",
        observations: [
          {
            category: "lipid_panel",
            canonical_name: "total_cholesterol",
            raw_name: "Colesterol Total",
            raw_value: "185",
            raw_unit: "mg/dL",
            normalized_value: 185,
            base_unit: "mg_dl",
            reference_low: 0,
            reference_high: 200,
          },
        ],
      };

      const parsed = LLMResultSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
    });

    it("should reject results with missing or empty collection_date", () => {
      expect(
        LLMResultSchema.safeParse({
          collection_date: "",
          observations: [],
        }).success,
      ).toBe(false);

      expect(
        LLMResultSchema.safeParse({
          observations: [],
        }).success,
      ).toBe(false);
    });
  });
});
