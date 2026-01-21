import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface StorageConfig {
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  forcePathStyle?: boolean;
}

export interface StorageClient {
  uploadFile(
    bucket: string,
    key: string,
    body: Buffer,
    contentType?: string
  ): Promise<void>;
  getFile(bucket: string, key: string): Promise<Buffer>;
  deleteFile(bucket: string, key: string): Promise<void>;
  listFiles(bucket: string, prefix?: string): Promise<string[]>;
  getSignedUploadUrl(
    bucket: string,
    key: string,
    expiresIn?: number,
    contentType?: string
  ): Promise<string>;
  getSignedDownloadUrl(
    bucket: string,
    key: string,
    expiresIn?: number
  ): Promise<string>;
}

/**
 * Create an S3-compatible storage client (works with Minio and Cloudflare R2)
 */
export function createStorageClient(config?: StorageConfig): StorageClient {
  const s3 = new S3Client({
    endpoint:
      config?.endpoint ?? process.env.STORAGE_ENDPOINT ?? "http://localhost:9000",
    region: config?.region ?? process.env.STORAGE_REGION ?? "us-east-1",
    credentials: {
      accessKeyId:
        config?.accessKeyId ?? process.env.STORAGE_ACCESS_KEY ?? "minioadmin",
      secretAccessKey:
        config?.secretAccessKey ??
        process.env.STORAGE_SECRET_KEY ??
        "minioadmin",
    },
    forcePathStyle: config?.forcePathStyle ?? true, // Required for Minio
  });

  return {
    async uploadFile(
      bucket: string,
      key: string,
      body: Buffer,
      contentType = "application/octet-stream"
    ): Promise<void> {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        })
      );
    },

    async getFile(bucket: string, key: string): Promise<Buffer> {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      if (!response.Body) {
        throw new Error(`File not found: ${bucket}/${key}`);
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    },

    async deleteFile(bucket: string, key: string): Promise<void> {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    },

    async listFiles(bucket: string, prefix?: string): Promise<string[]> {
      const response = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
        })
      );

      return (response.Contents ?? [])
        .map((obj) => obj.Key)
        .filter((key): key is string => key !== undefined);
    },

    async getSignedUploadUrl(
      bucket: string,
      key: string,
      expiresIn = 3600,
      contentType = "application/pdf"
    ): Promise<string> {
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      });
      return getSignedUrl(s3, command, { expiresIn });
    },

    async getSignedDownloadUrl(
      bucket: string,
      key: string,
      expiresIn = 3600
    ): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return getSignedUrl(s3, command, { expiresIn });
    },
  };
}

/**
 * Bucket names used across the application
 */
export const Buckets = {
  UPLOADS: "uploads",
} as const;

export type BucketName = (typeof Buckets)[keyof typeof Buckets];
