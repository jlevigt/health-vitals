import {
  type LLMProviderResponse,
  LLMProviderType,
  type ModelQuota,
} from "@health-vitals/contracts";
import { AppError } from "../errors/index.ts";
import type { Logger } from "../logger/interface.ts";
import { buildExtractionPrompt, parseExtractionResponse } from "./gemini.ts";
import type { LLMProvider } from "./interface.ts";

export interface OllamaProviderOptions {
  baseUrl?: string;
  model?: string;
}

interface OllamaChatResponse {
  model?: string;
  message?: {
    role?: string;
    content?: string;
  };
  prompt_eval_count?: number;
  eval_count?: number;
}

const OLLAMA_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    collection_date: {
      type: "string",
      description: "Date of the exam collection (e.g., YYYY-MM-DD).",
    },
    lab_name: {
      type: "string",
      description: "Name of the laboratory.",
    },
    observations: {
      type: "array",
      description: "List of all measurements and their results.",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
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
          canonical_name: { type: "string" },
          raw_name: { type: "string" },
          loinc_code: { type: "string" },
          raw_value: { type: "string" },
          raw_unit: { type: "string" },
          normalized_value: { type: "number" },
          base_unit: {
            type: "string",
            enum: ["mg_dl", "mmol_l", "percent", "ui_l", "ng_ml", "unknown"],
          },
          material: { type: "string" },
          reference_low: { type: "number" },
          reference_high: { type: "number" },
        },
        required: ["category", "canonical_name", "raw_name", "raw_value"],
      },
    },
  },
  required: ["collection_date", "observations"],
} as const;

/**
 * Local Ollama LLM provider for offline/free clinical report parsing
 */
export class OllamaProvider implements LLMProvider {
  public readonly provider = LLMProviderType.LOCAL;
  public readonly model: string;
  private readonly baseUrl: string;
  private readonly logger: Logger;

  constructor(logger: Logger, options?: OllamaProviderOptions) {
    this.logger = logger;
    this.baseUrl = (options?.baseUrl ?? "http://127.0.0.1:11434").replace(/\/+$/, "");
    this.model = options?.model ?? "llama3.2";
  }

  getQuota(): ModelQuota | null {
    return null;
  }

  async processDocument(extractedText: string, fileName: string): Promise<LLMProviderResponse> {
    const prompt = buildExtractionPrompt(extractedText, fileName);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          format: OLLAMA_RESPONSE_SCHEMA,
        }),
      });

      if (!response.ok) {
        this.logger.error("Ollama API returned non-OK status", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new AppError(`Ollama API error: ${response.status} ${response.statusText}`, 502);
      }

      const payload = (await response.json()) as OllamaChatResponse;
      const jsonText = payload.message?.content;
      const finalData = parseExtractionResponse(jsonText, prompt, this.logger);

      const promptTokens = payload.prompt_eval_count ?? 0;
      const completionTokens = payload.eval_count ?? 0;
      const usage =
        payload.prompt_eval_count !== undefined || payload.eval_count !== undefined
          ? {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: promptTokens + completionTokens,
            }
          : undefined;

      return {
        data: finalData,
        usage,
        model: payload.model ?? this.model,
      };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error("Error connecting to Ollama API.", { error: message });
      throw new AppError("Error communicating with LLM provider.", 502);
    }
  }
}
