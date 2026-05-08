/**
 * LLM Processor Unit Tests
 * 
 * Tests for LLM processing, rate limiting, and database persistence.
 */

import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { processWithLlm } from "../../src/consumers/ai-extraction/llm-processor.ts";
import { FileStatus, type LLMResult } from "@health-vitals/contracts";
import {
  getTestDb,
  closeTestDb,
  createMockLogger,
  createTestUser,
  createTestFile,
  cleanupTestUser,
  getFileStatus,
  getReportByFileId,
  getObservationsByReportId,
  type TestUser,
} from "./helpers.ts";

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

      const mockProvider = {
        processDocument: mock(() => Promise.resolve(mockLlmResult)),
      };

      await processWithLlm(
        db,
        file.id,
        testUser.id,
        "Sample extracted text from PDF",
        file.original_filename,
        logger,
        mockProvider
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

      const mockProvider = {
        processDocument: mock(() =>
          Promise.resolve({
            collection_date: "2025-01-15",
            observations: [],
          })
        ),
      };

      await processWithLlm(
        db,
        file.id,
        testUser.id,
        "Sample text",
        "test.pdf",
        logger,
        mockProvider
      );

      // Verify llm_requests entry
      const result = await db.query(
        "SELECT * FROM llm_requests WHERE file_id = $1",
        [file.id]
      );
      expect(result.rows.length).toBe(1);
      expect(result.rows[0].provider).toBe("gemini");
      expect(result.rows[0].finished_at).not.toBeNull();
    });

    it("should set FAILED_RETRYABLE on LLM error", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const mockProvider = {
        processDocument: mock(() =>
          Promise.reject(new Error("LLM API error"))
        ),
      };

      await expect(
        processWithLlm(
          db,
          file.id,
          testUser.id,
          "Sample text",
          "test.pdf",
          logger,
          mockProvider
        )
      ).rejects.toThrow("LLM API error");

      // Verify status was set to FAILED_RETRYABLE
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.FAILED_RETRYABLE);
    });

    it("should record error in llm_requests on failure", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const mockProvider = {
        processDocument: mock(() =>
          Promise.reject(new Error("Connection timeout"))
        ),
      };

      try {
        await processWithLlm(
          db,
          file.id,
          testUser.id,
          "Sample text",
          "test.pdf",
          logger,
          mockProvider
        );
      } catch {
        // Expected
      }

      // Verify error was recorded
      const result = await db.query(
        "SELECT * FROM llm_requests WHERE file_id = $1",
        [file.id]
      );
      expect(result.rows[0].error_code).toBe("LLM_ERROR");
      expect(result.rows[0].error_message).toContain("Connection timeout");
    });
  });
});
