import {
  Buckets,
  type Database,
  type Logger,
  NotFoundError,
  type StorageClient,
} from "@health-vitals/platform";

export interface DeleteFileResult {
  file_id: string;
  deleted: true;
}

export class DeleteFileService {
  constructor(
    private db: Database,
    private storage: StorageClient,
    private logger: Logger,
  ) {}

  async execute(userId: string, fileId: string): Promise<DeleteFileResult> {
    // Deleting the file cascades automatically to reports, observations, and llm_requests
    const result = await this.db.query(
      `DELETE FROM files
       WHERE id = $1 AND user_id = $2
       RETURNING id, object_key`,
      [fileId, userId],
    );

    if (result.rowCount === 0 || result.rows.length === 0) {
      throw new NotFoundError("File not found");
    }

    const { id, object_key: objectKey } = result.rows[0] as { id: string; object_key: string };

    try {
      await this.storage.deleteFile(Buckets.UPLOADS, objectKey);
    } catch (storageError: unknown) {
      this.logger.warn("File record deleted, but object removal from storage failed", {
        fileId: id,
        objectKey,
        error: storageError instanceof Error ? storageError.message : String(storageError),
      });
    }

    this.logger.info("Deleted file and cascaded clinical records", {
      userId,
      fileId: id,
    });

    return {
      file_id: id,
      deleted: true,
    };
  }
}
