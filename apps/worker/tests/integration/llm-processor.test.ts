/**
 * LLM Processor Integration Tests
 *
 * Tests for LLM processing, dynamic model-scoped rate limiting, and database persistence.
 */

import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import {
  ExamExtractionModel,
  FileStatus,
  GEMINI_MODEL_QUOTAS,
  type LLMProviderResponse,
  LLMProviderType,
  type LLMResult,
  type ModelQuota,
} from "@health-vitals/contracts";
import type { LLMProvider } from "@health-vitals/platform";
import { processWithLlm } from "../../src/consumers/ai-extraction/llm-processor.ts";
import {
  cleanupTestUser,
  closeTestDb,
  createMockLogger,
  createTestFile,
  createTestUser,
  getFileStatus,
  getObservationsByReportId,
  getReportByFileId,
  getTestDb,
  type TestUser,
} from "./helpers.ts";

function createStubProvider(options: {
  provider?: LLMProviderType;
  model?: string;
  quota?: ModelQuota | null;
  processDocument: LLMProvider["processDocument"];
}): LLMProvider {
  const provider = options.provider ?? LLMProviderType.GOOGLE;
  const model = options.model ?? ExamExtractionModel.GEMINI_3_5_FLASH_LITE;
  const quota =
    options.quota !== undefined
      ? options.quota
      : GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_3_5_FLASH_LITE];

  return {
    provider,
    model,
    getQuota: () => quota,
    processDocument: options.processDocument,
  };
}

describe("LLM Processor", () => {
  let testUser: TestUser;
  const db = getTestDb();
  const logger = createMockLogger();

  beforeAll(async () => {
    testUser = await createTestUser(db);
  });

  afterAll(async () => {
    await cleanupTestUser(db, testUser.id);
    await closeTestDb();
  });

  describe("processWithLlm", () => {
    it("should create report and observations on success", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
        filename: "test_report.pdf",
      });

      const mockLlmResult: LLMResult = {
        collection_date: "2025-01-15",
        lab_name: "Test Lab",
        observations: [
          {
            category: "lipid_panel",
            canonical_name: "total_cholesterol",
            raw_name: "Colesterol Total",
            raw_value: "180",
            raw_unit: "mg/dL",
            normalized_value: 180,
            base_unit: "mg_dl",
            reference_high: 200,
          },
        ],
      };

      const mockResponse: LLMProviderResponse = {
        data: mockLlmResult,
        model: ExamExtractionModel.GEMINI_3_5_FLASH_LITE,
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      const mockProvider = createStubProvider({
        processDocument: mock(() => Promise.resolve(mockResponse)),
      });

      await processWithLlm(
        db,
        file.id,
        testUser.id,
        "Sample extracted text from PDF",
        file.original_filename,
        logger,
        mockProvider,
      );

      // Verify report was created
      const report = await getReportByFileId(db, file.id);
      expect(report).not.toBeNull();
      expect(report.lab_name).toBe("Test Lab");
      expect(report.collection_date.toISOString().slice(0, 10)).toBe("2025-01-15");

      // Verify observations were created
      const observations = await getObservationsByReportId(db, report.id);
      expect(observations.length).toBe(1);
      expect(observations[0].raw_name).toBe("Colesterol Total");
    });

    it("should record LLM request in database", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const mockResponse: LLMProviderResponse = {
        data: {
          collection_date: "2025-01-15",
          observations: [],
        },
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const mockProvider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: ExamExtractionModel.GEMINI_3_5_FLASH_LITE,
        processDocument: mock(() => Promise.resolve(mockResponse)),
      });

      await processWithLlm(
        db,
        file.id,
        testUser.id,
        "Sample text",
        "test.pdf",
        logger,
        mockProvider,
      );

      // Verify llm_requests entry
      const result = await db.query("SELECT * FROM llm_requests WHERE file_id = $1", [file.id]);
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].provider).toBe(LLMProviderType.GOOGLE);
      expect(result.rows[0].model).toBe(ExamExtractionModel.GEMINI_3_5_FLASH_LITE);
      expect(result.rows[0].finished_at).not.toBeNull();
    });

    it("should set FAILED_RETRYABLE on LLM error", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const mockProvider = createStubProvider({
        processDocument: mock(() => Promise.reject(new Error("LLM API error"))),
      });

      await expect(
        processWithLlm(db, file.id, testUser.id, "Sample text", "test.pdf", logger, mockProvider),
      ).rejects.toThrow("LLM API error");

      // Verify status was set to FAILED_RETRYABLE
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.FAILED_RETRYABLE);
    });

    it("should record error in llm_requests on failure", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const mockProvider = createStubProvider({
        processDocument: mock(() => Promise.reject(new Error("Connection timeout"))),
      });

      try {
        await processWithLlm(
          db,
          file.id,
          testUser.id,
          "Sample text",
          "test.pdf",
          logger,
          mockProvider,
        );
      } catch {
        // Expected
      }

      // Verify error was recorded
      const result = await db.query("SELECT * FROM llm_requests WHERE file_id = $1", [file.id]);
      expect(result.rows[0].error_code).toBe("LLM_ERROR");
      expect(result.rows[0].error_message).toContain("Connection timeout");
    });
  });

  describe("Dynamic Rate Limiting", () => {
    const emptySuccessResponse: LLMProviderResponse = {
      data: {
        collection_date: "2026-01-15",
        observations: [],
      },
      usage: {
        prompt_tokens: 50,
        completion_tokens: 25,
        total_tokens: 75,
      },
    };

    it("should requeue file and throw when RPM, RPD, or TPM is exceeded for Tier 2 quota", async () => {
      const tier2Quota: ModelQuota = { rpm: 5, rpd: 20, tpm: 250_000 };

      // 1. Exceed RPM (5 requests in the last minute)
      const rpmModel = ExamExtractionModel.GEMINI_3_8_FLASH;
      const seedFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });
      for (let i = 0; i < 5; i++) {
        await db.query(
          `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
           VALUES ($1, $2, $3, now() - interval '10 seconds', 100)`,
          [seedFile.id, LLMProviderType.GOOGLE, rpmModel],
        );
      }

      const rpmTargetFile = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });
      const rpmProvider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: rpmModel,
        quota: tier2Quota,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await expect(
        processWithLlm(
          db,
          rpmTargetFile.id,
          testUser.id,
          "Sample text",
          "rpm.pdf",
          logger,
          rpmProvider,
        ),
      ).rejects.toThrow("Rate limit exceeded, job requeued");
      expect(await getFileStatus(db, rpmTargetFile.id)).toBe(FileStatus.QUEUED);

      // 2. Exceed RPD (20 requests today, outside the 1-minute RPM window)
      const rpdModel = ExamExtractionModel.GEMINI_3_6_FLASH;
      for (let i = 0; i < 20; i++) {
        await db.query(
          `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
           VALUES ($1, $2, $3, date_trunc('day', now()) + interval '1 second', 100)`,
          [seedFile.id, LLMProviderType.GOOGLE, rpdModel],
        );
      }
      // Move started_at to 5 minutes ago if we're past the first 5 minutes of the day,
      // ensuring it's within today (or within the current day window) while RPM < 5:
      await db.query(
        `UPDATE llm_requests
         SET started_at = GREATEST(date_trunc('day', now()), now() - interval '5 minutes')
         WHERE file_id = $1 AND model = $2`,
        [seedFile.id, rpdModel],
      );

      const rpdTargetFile = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });
      const rpdProvider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: rpdModel,
        quota: tier2Quota,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await expect(
        processWithLlm(
          db,
          rpdTargetFile.id,
          testUser.id,
          "Sample text",
          "rpd.pdf",
          logger,
          rpdProvider,
        ),
      ).rejects.toThrow("Rate limit exceeded, job requeued");
      expect(await getFileStatus(db, rpdTargetFile.id)).toBe(FileStatus.QUEUED);

      // 3. Exceed TPM (1 request in the last minute with 250,000 total_tokens)
      const tpmModel = ExamExtractionModel.GEMINI_3_FLASH;
      await db.query(
        `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
         VALUES ($1, $2, $3, now() - interval '15 seconds', 250000)`,
        [seedFile.id, LLMProviderType.GOOGLE, tpmModel],
      );

      const tpmTargetFile = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });
      const tpmProvider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: tpmModel,
        quota: tier2Quota,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await expect(
        processWithLlm(
          db,
          tpmTargetFile.id,
          testUser.id,
          "Sample text",
          "tpm.pdf",
          logger,
          tpmProvider,
        ),
      ).rejects.toThrow("Rate limit exceeded, job requeued");
      expect(await getFileStatus(db, tpmTargetFile.id)).toBe(FileStatus.QUEUED);
    });

    it("should allow 25 requests in a day with Tier 1 quota (500 RPD for gemini-3.5-flash-lite)", async () => {
      const tier1Model = ExamExtractionModel.GEMINI_3_1_FLASH_LITE;
      const tier1Quota = GEMINI_MODEL_QUOTAS[tier1Model]; // 15 RPM, 500 RPD, 250k TPM
      const seedFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });

      // Seed 24 requests earlier today (outside the 1-minute RPM window)
      for (let i = 0; i < 24; i++) {
        await db.query(
          `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
           VALUES ($1, $2, $3, GREATEST(date_trunc('day', now()), now() - interval '10 minutes'), 100)`,
          [seedFile.id, LLMProviderType.GOOGLE, tier1Model],
        );
      }

      // 25th request today should succeed (exceeds old 20 RPD limit, within 500 RPD limit)
      const targetFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });
      const tier1Provider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: tier1Model,
        quota: tier1Quota,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await processWithLlm(
        db,
        targetFile.id,
        testUser.id,
        "Sample text",
        "tier1_25th.pdf",
        logger,
        tier1Provider,
      );

      const report = await getReportByFileId(db, targetFile.id);
      expect(report).not.toBeNull();
    });

    it("should bypass rate limit checks when getQuota() returns null (mock or local)", async () => {
      const seedFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });

      // Seed 30 requests in the last minute with massive token usage for local/llama3.2
      for (let i = 0; i < 30; i++) {
        await db.query(
          `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
           VALUES ($1, $2, $3, now() - interval '5 seconds', 100000)`,
          [seedFile.id, LLMProviderType.LOCAL, "llama3.2"],
        );
      }

      const localFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });
      const localProvider = createStubProvider({
        provider: LLMProviderType.LOCAL,
        model: "llama3.2",
        quota: null,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await processWithLlm(
        db,
        localFile.id,
        testUser.id,
        "Sample text",
        "local_exam.pdf",
        logger,
        localProvider,
      );

      const localReport = await getReportByFileId(db, localFile.id);
      expect(localReport).not.toBeNull();

      const mockFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });
      const mockProvider = createStubProvider({
        provider: LLMProviderType.MOCK,
        model: "mock-model",
        quota: null,
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await processWithLlm(
        db,
        mockFile.id,
        testUser.id,
        "Sample text",
        "mock_exam.pdf",
        logger,
        mockProvider,
      );

      const mockReport = await getReportByFileId(db, mockFile.id);
      expect(mockReport).not.toBeNull();
    });

    it("should isolate rate limit counts per model (model A requests do not block model B)", async () => {
      const seedFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });

      // Exhaust RPM/RPD on model A (gemini-2.5-flash)
      for (let i = 0; i < 20; i++) {
        await db.query(
          `INSERT INTO llm_requests (file_id, provider, model, started_at, total_tokens)
           VALUES ($1, $2, $3, now() - interval '10 seconds', 50000)`,
          [seedFile.id, LLMProviderType.GOOGLE, ExamExtractionModel.GEMINI_2_5_FLASH],
        );
      }

      // Model B (gemini-3.5-flash-lite) should still proceed cleanly
      const targetFile = await createTestFile(db, testUser.id, { status: FileStatus.PROCESSING });
      const modelBProvider = createStubProvider({
        provider: LLMProviderType.GOOGLE,
        model: ExamExtractionModel.GEMINI_3_5_FLASH_LITE,
        quota: GEMINI_MODEL_QUOTAS[ExamExtractionModel.GEMINI_3_5_FLASH_LITE],
        processDocument: mock(() => Promise.resolve(emptySuccessResponse)),
      });

      await processWithLlm(
        db,
        targetFile.id,
        testUser.id,
        "Sample text",
        "isolated_model.pdf",
        logger,
        modelBProvider,
      );

      const report = await getReportByFileId(db, targetFile.id);
      expect(report).not.toBeNull();
    });
  });
});
