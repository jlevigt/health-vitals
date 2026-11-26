import { z } from "zod";

/**
 * Supported LLM Provider types
 */
export const LLMProviderType = {
  GOOGLE: "google",
  LOCAL: "local",
  MOCK: "mock",
} as const;

export type LLMProviderType = (typeof LLMProviderType)[keyof typeof LLMProviderType];
export const LLMProviderTypeSchema = z.nativeEnum(LLMProviderType);

/**
 * Active Gemini "Text-out" models with RPD > 0 for clinical exam extraction
 */
export const ExamExtractionModel = {
  // Tier 1: High daily volume (500 RPD, 15 RPM, 250k TPM)
  GEMINI_3_5_FLASH_LITE: "gemini-3.5-flash-lite",
  GEMINI_3_1_FLASH_LITE: "gemini-3.1-flash-lite",

  // Tier 2: Low daily volume / reasoning fallbacks (20 RPD, 5-10 RPM, 250k TPM)
  GEMINI_3_8_FLASH: "gemini-3.8-flash",
  GEMINI_3_6_FLASH: "gemini-3.6-flash",
  GEMINI_3_FLASH: "gemini-3-flash",
  GEMINI_2_5_FLASH_LITE: "gemini-2.5-flash-lite",
  GEMINI_2_5_FLASH: "gemini-2.5-flash",
} as const;

export type ExamExtractionModel = (typeof ExamExtractionModel)[keyof typeof ExamExtractionModel];
export const ExamExtractionModelSchema = z.nativeEnum(ExamExtractionModel);
export const DEFAULT_EXAM_EXTRACTION_MODEL = ExamExtractionModel.GEMINI_3_5_FLASH_LITE;

/**
 * Rate limit quota configuration for a specific LLM model
 */
export interface ModelQuota {
  rpm: number; // Requests per minute
  tpm: number; // Tokens per minute
  rpd: number; // Requests per day
}

/**
 * Lookup table of quotas per Gemini extraction model
 */
export const GEMINI_MODEL_QUOTAS: Record<ExamExtractionModel, ModelQuota> = {
  [ExamExtractionModel.GEMINI_3_5_FLASH_LITE]: { rpm: 15, tpm: 250_000, rpd: 500 },
  [ExamExtractionModel.GEMINI_3_1_FLASH_LITE]: { rpm: 15, tpm: 250_000, rpd: 500 },
  [ExamExtractionModel.GEMINI_3_8_FLASH]: { rpm: 5, tpm: 250_000, rpd: 20 },
  [ExamExtractionModel.GEMINI_3_6_FLASH]: { rpm: 5, tpm: 250_000, rpd: 20 },
  [ExamExtractionModel.GEMINI_3_FLASH]: { rpm: 5, tpm: 250_000, rpd: 20 },
  [ExamExtractionModel.GEMINI_2_5_FLASH_LITE]: { rpm: 10, tpm: 250_000, rpd: 20 },
  [ExamExtractionModel.GEMINI_2_5_FLASH]: { rpm: 5, tpm: 250_000, rpd: 20 },
};

/**
 * LLM usage metrics for technical tracking and billing
 */
export interface LLMUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/**
 * Combined response from an LLM provider including usage metrics
 */
export interface LLMProviderResponse {
  data: LLMResult;
  usage?: LLMUsage;
  model?: string;
}

/**
 * Runtime validation schema for a single extracted observation
 */
export const LLMObservationSchema = z.object({
  category: z.string().min(1),
  canonical_name: z.string().min(1),
  raw_name: z.string().min(1),
  loinc_code: z.string().optional(),
  raw_value: z.string(),
  raw_unit: z.string().optional(),
  material: z.string().optional(),
  normalized_value: z.number().optional(),
  base_unit: z.string().optional(),
  reference_low: z.number().optional(),
  reference_high: z.number().optional(),
});

/**
 * Runtime validation schema for structured LLM extraction output
 */
export const LLMResultSchema = z.object({
  collection_date: z.string().min(1),
  lab_name: z.string().optional(),
  observations: z.array(LLMObservationSchema),
});

export interface LLMResult {
  collection_date: string;
  lab_name?: string;
  observations: Array<{
    category: string;
    canonical_name: string;
    raw_name: string;
    loinc_code?: string;
    raw_value: string;
    raw_unit?: string;
    material?: string;
    normalized_value?: number;
    base_unit?: string;
    reference_low?: number;
    reference_high?: number;
  }>;
}
