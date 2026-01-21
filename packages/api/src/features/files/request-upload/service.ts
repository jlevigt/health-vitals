import type { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import { createStorageClient, Buckets } from "@health-data/shared/storage";
import type { ILogger } from "@/shared/logger/interface.ts";
import {
  FileUploadItem,
  FileUploadUrlResponse,
  RequestUploadResponse,
} from "./types.ts";

const SIGNED_URL_EXPIRES_IN = 3600; // 1 hour

export class RequestUploadService {
  private storage = createStorageClient();

  constructor(
    private pool: Pool,
    private logger: ILogger
  ) {}

  async execute(
    userId: string,
    files: FileUploadItem[]
  ): Promise<RequestUploadResponse> {
    this.logger.info(`Requesting upload URLs for ${files.length} files`, {
      userId,
    });

    const client = await this.pool.connect();
    const results: FileUploadUrlResponse[] = [];

    try {
      await client.query("BEGIN");

      for (const file of files) {
        const fileId = uuidv4();
        const objectKey = `uploads/${userId}/${fileId}.pdf`;
        const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRES_IN * 1000);

        // Insert file record in CREATED state
        await client.query(
          `INSERT INTO files (id, user_id, original_filename, object_key, size_bytes, content_type, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'CREATED')`,
          [
            fileId,
            userId,
            file.original_filename,
            objectKey,
            file.size_bytes,
            file.content_type,
          ]
        );

        // Generate signed upload URL
        const uploadUrl = await this.storage.getSignedUploadUrl(
          Buckets.UPLOADS,
          objectKey,
          SIGNED_URL_EXPIRES_IN,
          file.content_type
        );

        results.push({
          file_id: fileId,
          object_key: objectKey,
          upload_url: uploadUrl,
          expires_at: expiresAt.toISOString(),
        });
      }

      await client.query("COMMIT");

      this.logger.info(`Created ${results.length} file records with upload URLs`, {
        userId,
        fileIds: results.map((r) => r.file_id),
      });

      return { files: results };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
