import { describe, expect, it, mock } from "bun:test";
import {
  Buckets,
  type Database,
  type Logger,
  NotFoundError,
  type StorageClient,
} from "@health-vitals/platform";
import { DeleteFileService } from "./service.ts";

function createLoggerMock(): Logger {
  const logger: Logger = {
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    debug: mock(() => {}),
    child: mock(() => logger),
  };
  return logger;
}

describe("DeleteFileService", () => {
  it("deletes user-owned file record (cascading reports/observations) and removes S3 object", async () => {
    const db = {
      query: mock(async () => ({
        rowCount: 1,
        rows: [{ id: "file-1", object_key: "uploads/user-1/file-1.pdf" }],
      })),
    } as unknown as Database;

    const storage = {
      deleteFile: mock(async () => {}),
    } as unknown as StorageClient;

    const service = new DeleteFileService(db, storage, createLoggerMock());
    const result = await service.execute("user-1", "file-1");

    expect(result).toEqual({ file_id: "file-1", deleted: true });
    expect(storage.deleteFile).toHaveBeenCalledWith(Buckets.UPLOADS, "uploads/user-1/file-1.pdf");
  });

  it("throws NotFoundError when file does not exist or belongs to another user", async () => {
    const db = {
      query: mock(async () => ({ rowCount: 0, rows: [] })),
    } as unknown as Database;
    const storage = {
      deleteFile: mock(async () => {}),
    } as unknown as StorageClient;

    const service = new DeleteFileService(db, storage, createLoggerMock());

    await expect(service.execute("user-1", "missing-id")).rejects.toBeInstanceOf(NotFoundError);
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it("still succeeds when storage object removal fails after DB deletion", async () => {
    const logger = createLoggerMock();
    const db = {
      query: mock(async () => ({
        rowCount: 1,
        rows: [{ id: "file-2", object_key: "uploads/user-1/file-2.pdf" }],
      })),
    } as unknown as Database;
    const storage = {
      deleteFile: mock(async () => {
        throw new Error("NoSuchKey");
      }),
    } as unknown as StorageClient;

    const service = new DeleteFileService(db, storage, logger);
    const result = await service.execute("user-1", "file-2");

    expect(result).toEqual({ file_id: "file-2", deleted: true });
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
