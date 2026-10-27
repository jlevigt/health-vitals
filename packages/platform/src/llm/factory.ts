import {
  DEFAULT_EXAM_EXTRACTION_MODEL,
  type ExamExtractionModel,
  LLMProviderType,
} from "@health-vitals/contracts";
import type { Logger } from "../logger/interface.ts";
import { GeminiProvider } from "./gemini.ts";
import type { LLMProvider } from "./interface.ts";
import { MockLLMProvider } from "./mock.ts";
import { OllamaProvider } from "./ollama.ts";

export interface LLMProviderConfig {
  provider: LLMProviderType;
  geminiApiKey?: string;
  geminiModel?: ExamExtractionModel;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

/**
 * Factory creating the active LLMProvider based on environment configuration
 */
export function createLLMProvider(config: LLMProviderConfig, logger: Logger): LLMProvider {
  switch (config.provider) {
    case LLMProviderType.GOOGLE: {
      if (!config.geminiApiKey) {
        throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER is 'google'");
      }
      return new GeminiProvider(
        logger,
        config.geminiApiKey,
        config.geminiModel ?? DEFAULT_EXAM_EXTRACTION_MODEL,
      );
    }
    case LLMProviderType.LOCAL: {
      return new OllamaProvider(logger, {
        baseUrl: config.ollamaBaseUrl,
        model: config.ollamaModel,
      });
    }
    case LLMProviderType.MOCK: {
      return new MockLLMProvider();
    }
    default: {
      const exhaustiveCheck: never = config.provider;
      throw new Error(`Unsupported LLM provider: ${String(exhaustiveCheck)}`);
    }
  }
}
