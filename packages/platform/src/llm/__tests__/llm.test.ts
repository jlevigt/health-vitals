import { afterEach, describe, expect, it, mock } from "bun:test";
import { ExamExtractionModel, LLMProviderType } from "@health-vitals/contracts";
import { AppError } from "../../errors/index.ts";
import { createLogger } from "../../logger/index.ts";
import { createLLMProvider } from "../factory.ts";
import { GeminiProvider } from "../gemini.ts";
import { MockLLMProvider } from "../mock.ts";
import { OllamaProvider } from "../ollama.ts";

const silentLogger = createLogger({ name: "llm-test", level: "silent" });

describe("Platform LLM Providers & Factory", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("createLLMProvider", () => {
    it("should create GeminiProvider with default model when provider is 'google'", () => {
      const provider = createLLMProvider(
        {
          provider: LLMProviderType.GOOGLE,
          geminiApiKey: "test-api-key",
        },
        silentLogger,
      );

      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.provider).toBe(LLMProviderType.GOOGLE);
      expect(provider.model).toBe(ExamExtractionModel.GEMINI_3_5_FLASH_LITE);
      expect(provider.getQuota()).toEqual({
        rpm: 15,
        tpm: 250_000,
        rpd: 500,
      });
    });

    it("should create GeminiProvider with selected Tier 2 model and quota", () => {
      const provider = createLLMProvider(
        {
          provider: LLMProviderType.GOOGLE,
          geminiApiKey: "test-api-key",
          geminiModel: ExamExtractionModel.GEMINI_3_8_FLASH,
        },
        silentLogger,
      );

      expect(provider).toBeInstanceOf(GeminiProvider);
      expect(provider.model).toBe(ExamExtractionModel.GEMINI_3_8_FLASH);
      expect(provider.getQuota()).toEqual({
        rpm: 5,
        tpm: 250_000,
        rpd: 20,
      });
    });

    it("should fail fast when provider is 'google' and geminiApiKey is missing", () => {
      expect(() =>
        createLLMProvider(
          {
            provider: LLMProviderType.GOOGLE,
          },
          silentLogger,
        ),
      ).toThrow("GEMINI_API_KEY is required when LLM_PROVIDER is 'google'");
    });

    it("should create OllamaProvider with null quota when provider is 'local'", () => {
      const provider = createLLMProvider(
        {
          provider: LLMProviderType.LOCAL,
          ollamaBaseUrl: "http://127.0.0.1:11434",
          ollamaModel: "llama3.2",
        },
        silentLogger,
      );

      expect(provider).toBeInstanceOf(OllamaProvider);
      expect(provider.provider).toBe(LLMProviderType.LOCAL);
      expect(provider.model).toBe("llama3.2");
      expect(provider.getQuota()).toBeNull();
    });

    it("should create MockLLMProvider with null quota when provider is 'mock'", () => {
      const provider = createLLMProvider(
        {
          provider: LLMProviderType.MOCK,
        },
        silentLogger,
      );

      expect(provider).toBeInstanceOf(MockLLMProvider);
      expect(provider.provider).toBe(LLMProviderType.MOCK);
      expect(provider.model).toBe("mock-model");
      expect(provider.getQuota()).toBeNull();
    });
  });

  describe("OllamaProvider", () => {
    it("should send POST /api/chat with structured format and map token usage", async () => {
      let capturedUrl = "";
      let capturedBody: Record<string, unknown> = {};

      const mockFetch = mock(async (input: string | URL | Request, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedBody = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;

        return new Response(
          JSON.stringify({
            model: "llama3.2",
            message: {
              role: "assistant",
              content: JSON.stringify({
                collection_date: "2026-02-10",
                lab_name: "Local Ollama Lab",
                observations: [
                  {
                    category: "glucose_metabolism",
                    canonical_name: "glucose",
                    raw_name: "Glicose",
                    raw_value: "91",
                    raw_unit: "mg/dL",
                    normalized_value: 91,
                    base_unit: "mg_dl",
                    reference_low: 70,
                    reference_high: 99,
                    loinc_code: null,
                  },
                ],
              }),
            },
            prompt_eval_count: 120,
            eval_count: 80,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const ollama = new OllamaProvider(silentLogger, {
        baseUrl: "http://127.0.0.1:11434/",
        model: "llama3.2",
      });

      const result = await ollama.processDocument("Glicose: 91 mg/dL", "exam.pdf");

      expect(capturedUrl).toBe("http://127.0.0.1:11434/api/chat");
      expect(capturedBody.model).toBe("llama3.2");
      expect(capturedBody.stream).toBe(false);
      expect(capturedBody.format).toBeDefined();

      expect(result.model).toBe("llama3.2");
      expect(result.usage).toEqual({
        prompt_tokens: 120,
        completion_tokens: 80,
        total_tokens: 200,
      });
      expect(result.data.collection_date).toBe("2026-02-10");
      expect(result.data.lab_name).toBe("Local Ollama Lab");
      expect(result.data.observations).toHaveLength(1);
      expect(result.data.observations[0].canonical_name).toBe("glucose");
    });

    it("should merge array responses into a single LLMResult object", async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            model: "llama3.2",
            message: {
              role: "assistant",
              content: JSON.stringify([
                {
                  collection_date: "2026-03-01",
                  lab_name: "Merged Lab",
                  observations: [
                    {
                      category: "hematology",
                      canonical_name: "hemoglobin",
                      raw_name: "Hemoglobina",
                      raw_value: "14.2",
                    },
                  ],
                },
                {
                  observations: [
                    {
                      category: "lipid_panel",
                      canonical_name: "total_cholesterol",
                      raw_name: "Colesterol Total",
                      raw_value: "175",
                    },
                  ],
                },
              ]),
            },
          }),
          { status: 200 },
        );
      });

      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const ollama = new OllamaProvider(silentLogger);
      const result = await ollama.processDocument("Sample text", "report.pdf");

      expect(result.data.collection_date).toBe("2026-03-01");
      expect(result.data.observations).toHaveLength(2);
    });

    it("should throw AppError (502) on non-OK HTTP response", async () => {
      const mockFetch = mock(async () => new Response("Internal Server Error", { status: 500 }));
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const ollama = new OllamaProvider(silentLogger);
      await expect(ollama.processDocument("Sample text", "report.pdf")).rejects.toBeInstanceOf(
        AppError,
      );
    });

    it("should throw AppError (502) on malformed JSON content", async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            message: { content: "{not-valid-json" },
          }),
          { status: 200 },
        );
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const ollama = new OllamaProvider(silentLogger);
      await expect(ollama.processDocument("Sample text", "report.pdf")).rejects.toThrow(
        "LLM returned malformed JSON.",
      );
    });

    it("should throw AppError (502) when collection_date is missing", async () => {
      const mockFetch = mock(async () => {
        return new Response(
          JSON.stringify({
            message: {
              content: JSON.stringify({
                observations: [],
              }),
            },
          }),
          { status: 200 },
        );
      });
      globalThis.fetch = mockFetch as unknown as typeof fetch;

      const ollama = new OllamaProvider(silentLogger);
      await expect(ollama.processDocument("Sample text", "report.pdf")).rejects.toThrow(
        "LLM failed to return a collection_date.",
      );
    });
  });
});
