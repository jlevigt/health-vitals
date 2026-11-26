import { GoogleGenAI, Type } from "@google/genai";
import {
  DEFAULT_EXAM_EXTRACTION_MODEL,
  type ExamExtractionModel,
  GEMINI_MODEL_QUOTAS,
  type LLMProviderResponse,
  LLMProviderType,
  type LLMResult,
  LLMResultSchema,
  type ModelQuota,
} from "@health-vitals/contracts";
import { AppError } from "../errors/index.ts";
import type { Logger } from "../logger/interface.ts";
import type { LLMProvider } from "./interface.ts";

/**
 * Shared prompt builder for clinical exam extraction
 */
export function buildExtractionPrompt(extractedText: string, fileName: string): string {
  return (
    `Analyze the entire following lab report text and the provided file name. Return a SINGLE JSON object that represents the whole document. ` +
    `Do not create multiple objects or an array. The object MUST contain a 'collection_date' in YYYY-MM-DD format. ` +
    `The 'lab_name' is optional. ` +
    `Aggregate ALL measurements from all sections of the report into a single 'observations' array. ` +
    `For each measurement, extract: ` +
    `- category: One of ['lipid_panel', 'glucose_metabolism', 'blood_pressure', 'hematology', 'hormones', 'renal_function', 'liver_function', 'other'] ` +
    `- canonical_name: A standardized, lowercase, snake_case name for the measurement (e.g. 'hemoglobin', 'total_cholesterol'). ` +
    `- raw_name: The name exactly as it appears in the text. ` +
    `- raw_value: The value as text. ` +
    `- raw_unit: The unit as text. ` +
    `- normalized_value: The numeric value. Use '.' as decimal separator if original uses ','. ` +
    `- base_unit: One of ['mg_dl', 'mmol_l', 'percent', 'ui_l', 'ng_ml', 'unknown']. ` +
    `- reference_low: Lower bound numeric value (if available). ` +
    `- reference_high: Upper bound numeric value (if available). ` +
    `- loinc_code: LOINC code if available. ` +
    `- material: Specimen material. ` +
    `Note: Ensure 'collection_date' is always valid and in 'YYYY-MM-DD' format. If only a year is found, use 'YYYY-01-01'. ` +
    `File Name: ${fileName}\n` +
    `Text: ${extractedText}`
  );
}

/**
 * Recursively strips null values from objects so optional Zod fields validate cleanly
 */
function stripNulls(value: unknown): unknown {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(stripNulls);
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== null && v !== undefined) {
        result[k] = stripNulls(v);
      }
    }
    return result;
  }
  return value;
}

/**
 * Merges an array of LLM result items into a single candidate object
 */
function mergeArrayResponse(items: unknown[], logger: Logger): Record<string, unknown> {
  logger.error("LLM returned an array, merging into a single result.", {
    count: items.length,
  });
  if (items.length === 0) {
    throw new AppError("LLM returned an empty array.", 502);
  }

  const firstItem = (items[0] ?? {}) as Record<string, unknown>;
  const allObservations = items.flatMap((item) => {
    const record = (item ?? {}) as Record<string, unknown>;
    const obs = record.observations ?? record.measurements;
    return Array.isArray(obs) ? obs : [];
  });

  return {
    collection_date:
      typeof firstItem.collection_date === "string" && firstItem.collection_date.length > 0
        ? firstItem.collection_date
        : new Date().toISOString().split("T")[0],
    lab_name: typeof firstItem.lab_name === "string" ? firstItem.lab_name : undefined,
    observations: allObservations,
  };
}

/**
 * Shared parser and validator for structured LLM JSON responses
 */
export function parseExtractionResponse(
  jsonText: string | undefined,
  prompt: string,
  logger: Logger,
): LLMResult {
  if (!jsonText) {
    logger.error("LLM returned empty or invalid response.", { prompt });
    throw new AppError("LLM failed to return structured JSON.", 502);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    logger.error("Failed to parse LLM JSON response", { jsonText });
    throw new AppError("LLM returned malformed JSON.", 502);
  }

  let candidate: Record<string, unknown>;
  if (Array.isArray(parsedJson)) {
    candidate = mergeArrayResponse(parsedJson, logger);
  } else if (parsedJson && typeof parsedJson === "object") {
    candidate = parsedJson as Record<string, unknown>;
  } else {
    throw new AppError("LLM returned malformed JSON.", 502);
  }

  if (typeof candidate.collection_date !== "string" || candidate.collection_date.trim() === "") {
    throw new AppError("LLM failed to return a collection_date.", 502);
  }

  const sanitized = stripNulls(candidate);
  const validated = LLMResultSchema.safeParse(sanitized);
  if (!validated.success) {
    logger.error("LLM response failed schema validation", {
      issues: validated.error.issues,
    });
    throw new AppError("LLM response failed schema validation.", 502);
  }

  return validated.data;
}

/**
 * Gemini LLM provider for health report parsing
 */
export class GeminiProvider implements LLMProvider {
  public readonly provider = LLMProviderType.GOOGLE;
  public readonly model: ExamExtractionModel;
  private ai: GoogleGenAI;
  private logger: Logger;

  constructor(
    logger: Logger,
    apiKey?: string,
    model: ExamExtractionModel = DEFAULT_EXAM_EXTRACTION_MODEL,
  ) {
    this.logger = logger;
    this.model = model;
    const key = apiKey ?? process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is required for GeminiProvider");
    }
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  getQuota(): ModelQuota | null {
    return GEMINI_MODEL_QUOTAS[this.model];
  }

  async processDocument(extractedText: string, fileName: string): Promise<LLMProviderResponse> {
    const prompt = buildExtractionPrompt(extractedText, fileName);

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        },
        // @ts-expect-error - responseSchema types not fully exposed
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            collection_date: {
              type: Type.STRING,
              description: "Date of the exam collection (e.g., YYYY-MM-DD).",
            },
            lab_name: { type: Type.STRING, description: "Name of the laboratory." },
            observations: {
              type: Type.ARRAY,
              description: "List of all measurements and their results.",
              items: {
                type: Type.OBJECT,
                properties: {
                  category: {
                    type: Type.STRING,
                    enum: [
                      "lipid_panel",
                      "glucose_metabolism",
                      "blood_pressure",
                      "hematology",
                      "hormones",
                      "renal_function",
                      "liver_function",
                      "other",
                    ],
                  },
                  canonical_name: { type: Type.STRING },
                  raw_name: {
                    type: Type.STRING,
                    description: "Name of the measurement as written in the report.",
                  },
                  loinc_code: { type: Type.STRING, description: "LOINC code, if available." },
                  raw_value: {
                    type: Type.STRING,
                    description: "Value of the measurement, can be numeric or text.",
                  },
                  raw_unit: {
                    type: Type.STRING,
                    description: "Unit of the measurement, if available.",
                  },
                  normalized_value: { type: Type.NUMBER },
                  base_unit: {
                    type: Type.STRING,
                    enum: ["mg_dl", "mmol_l", "percent", "ui_l", "ng_ml", "unknown"],
                  },
                  material: {
                    type: Type.STRING,
                    description: "Specimen material (e.g., Blood, Serum).",
                  },
                  reference_low: {
                    type: Type.NUMBER,
                    description: "Lower bound of the reference range.",
                  },
                  reference_high: {
                    type: Type.NUMBER,
                    description: "Upper bound of the reference range.",
                  },
                },
                required: ["category", "canonical_name", "raw_name", "raw_value"],
              },
            },
          },
          required: ["collection_date", "observations"],
        },
      });

      const usage = response.usageMetadata
        ? {
            prompt_tokens: response.usageMetadata.promptTokenCount ?? 0,
            completion_tokens: response.usageMetadata.candidatesTokenCount ?? 0,
            total_tokens: response.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined;

      const jsonText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      const finalData = parseExtractionResponse(jsonText, prompt, this.logger);

      return {
        data: finalData,
        usage,
        model: this.model,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Error connecting to Gemini API.", { error: message });
      throw new AppError("Error communicating with LLM provider.", 502);
    }
  }
}
