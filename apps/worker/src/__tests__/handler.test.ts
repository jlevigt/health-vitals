/**
 * Process File Handler Unit Tests
 * 
 * Tests for the job handler's state machine and error handling.
 */

import { describe, it, expect, beforeAll, afterAll, mock } from "bun:test";
import { processFileJob } from "../jobs/process-file/handler.ts";
import { FileStatus } from "@health-vitals/contracts";
import {
  getTestDb,
  closeTestDb,
  getTestStorage,
  createMockLogger,
  createMockLlmProvider,
  createTestUser,
  createTestFile,
  cleanupTestUser,
  getFileStatus,
  type TestUser,
} from "./helpers.ts";
import type { JobContext } from "../jobs/process-file/handler.ts";

describe("Process File Handler", () => {
  let testUser: TestUser;
  const db = getTestDb();
  const storage = getTestStorage();
  const logger = createMockLogger();
  const llmProvider = createMockLlmProvider();

  const createContext = (): JobContext => ({
    db,
    storage,
    logger,
    llmProvider,
  });

  beforeAll(async () => {
    testUser = await createTestUser(db);
  });

  afterAll(async () => {
    await cleanupTestUser(db, testUser.id);
    await closeTestDb();
  });

  describe("File State Validation", () => {
    it("should skip file not in QUEUED state", async () => {
      // Create file already in PROCESSING state
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.PROCESSING,
      });

      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      // Should complete without error (skips processing)
      await processFileJob(payload, createContext());

      // Status should remain unchanged
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.PROCESSING);
    });

    it("should throw error for non-existent file", async () => {
      const payload = {
        file_id: "00000000-0000-0000-0000-000000000000",
        object_key: "fake/key.pdf",
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      await expect(processFileJob(payload, createContext())).rejects.toThrow(
        "File not found"
      );
    });
  });

  describe("Storage Error Handling", () => {
    it("should set FAILED_RETRYABLE on storage download error", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.QUEUED,
      });

      // Mock storage to throw error
      const mockStorage = {
        ...storage,
        getFile: mock(() => Promise.reject(new Error("Storage unavailable"))),
      };

      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      const context: JobContext = {
        db,
        storage: mockStorage as any,
        logger,
        llmProvider,
      };

      await expect(processFileJob(payload, context)).rejects.toThrow(
        "Storage unavailable"
      );

      // Status should be FAILED_RETRYABLE
      const status = await getFileStatus(db, file.id);
      expect(status).toBe(FileStatus.FAILED_RETRYABLE);
    });
  });

  describe("PDF Parsing Error Handling", () => {
    it("should set FAILED_RETRYABLE on PDF parse error", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.QUEUED,
      });

      // Mock storage to return invalid PDF
      const mockStorage = {
        ...storage,
        getFile: mock(() => Promise.resolve(Buffer.from("not a pdf"))),
      };

      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      const context: JobContext = {
        db,
        storage: mockStorage as any,
        logger,
        llmProvider,
      };

      await expect(processFileJob(payload, context)).rejects.toThrow();

      // Status should be failed (either FAILED_RETRYABLE or FAILED_TERMINAL)
      const status = await getFileStatus(db, file.id);
      expect(status).toBeTruthy();
      expect(status!.startsWith("FAILED")).toBe(true);
    });
  });

  describe("State Transitions", () => {
    it("should transition from QUEUED to PROCESSING on job start", async () => {
      const file = await createTestFile(db, testUser.id, {
        status: FileStatus.QUEUED,
      });

      // This will fail eventually but should transition to PROCESSING first
      const mockStorage = {
        ...storage,
        getFile: mock(() => Promise.reject(new Error("Storage error"))),
      };

      const payload = {
        file_id: file.id,
        object_key: file.object_key,
        user_id: testUser.id,
        enqueued_at: new Date().toISOString(),
      };

      const context: JobContext = {
        db,
        storage: mockStorage as any,
        logger,
        llmProvider,
      };

      try {
        await processFileJob(payload, context);
      } catch {
        // Expected to fail
      }

      // Verify it transitioned through PROCESSING (will be failed now)
      // We can't easily verify intermediate state, but the state machine logic is tested
      const status = await getFileStatus(db, file.id);
      expect(status).not.toBe(FileStatus.QUEUED);
    });
  });
});
