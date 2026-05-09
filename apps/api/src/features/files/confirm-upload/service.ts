import { type FileProcessJobPayload, FileStatus } from "@health-vitals/contracts";
import type { Database, Logger, QueueChannel } from "@health-vitals/platform";
import { AppError, publishJob, Queues } from "@health-vitals/platform";
import type { ConfirmUploadResponse } from "../types.ts";

export class ConfirmUploadService {
  constructor(
    private db: Database,
    private logger: Logger,
    private getQueueChannel: () => Promise<QueueChannel>,
  ) {}

  async execute(
    userId: string,
    fileId: string,
    _etag?: string,
    _checksum?: string,
  ): Promise<ConfirmUploadResponse> {
    this.logger.info(`Confirming upload for file ${fileId}`, { userId, fileId });

    const client = await this.db.connect();

    try {
      await client.query("BEGIN");

      // Fetch and lock the file record
      const fileResult = await client.query(
        `SELECT id, user_id, object_key, status
         FROM files
         WHERE id = $1
         FOR UPDATE`,
        [fileId],
      );

      if (fileResult.rows.length === 0) {
        throw new AppError("File not found", 404);
      }

      const file = fileResult.rows[0];

      // Verify ownership
      if (file.user_id !== userId) {
        throw new AppError("File not found", 404); // Don't leak existence
      }

      // Validate state transition
      if (file.status !== FileStatus.CREATED) {
        throw new AppError(`Cannot confirm upload: file is in '${file.status}' state`, 400);
      }

      // Transition to QUEUED
      const now = new Date();
      await client.query(
        `UPDATE files
         SET status = $1, enqueued_at = $2
         WHERE id = $3`,
        [FileStatus.QUEUED, now, fileId],
      );

      await client.query("COMMIT");

      // Publish job to queue (after commit to avoid orphan messages)
      const jobPayload: FileProcessJobPayload = {
        file_id: fileId,
        object_key: file.object_key,
        user_id: userId,
        enqueued_at: now.toISOString(),
      };

      try {
        const channel = await this.getQueueChannel();
        await publishJob(channel, Queues.FILE_PROCESSING, jobPayload);
        this.logger.info(`Job published for file ${fileId}`, { fileId });
      } catch (queueError) {
        // Log but don't fail - worker can pick up from DB scan
        this.logger.error("Failed to publish job to queue", {
          error: queueError,
          fileId,
        });
      }

      return {
        file_id: fileId,
        status: FileStatus.QUEUED,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
