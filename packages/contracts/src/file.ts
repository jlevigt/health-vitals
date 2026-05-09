import { z } from "zod";

/**
 * File status constants matching database CHECK constraint
 */
export const FileStatus = {
  CREATED: "CREATED",
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  SUCCEEDED: "SUCCEEDED",
  FAILED_RETRYABLE: "FAILED_RETRYABLE",
  FAILED_TERMINAL: "FAILED_TERMINAL",
} as const;

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];

/**
 * Zod schema for file status
 */
export const FileStatusSchema = z.nativeEnum(FileStatus);

/**
 * Zod schema for a single file upload request item
 */
export const FileUploadItemSchema = z.object({
  original_filename: z.string().min(1).max(255),
  size_bytes: z
    .number()
    .positive()
    .max(50 * 1024 * 1024), // Max 50MB
  content_type: z.string().default("application/pdf"),
});

export type FileUploadItem = z.infer<typeof FileUploadItemSchema>;

/**
 * Schema for requesting multiple upload URLs
 */
export const RequestUploadBodySchema = z.object({
  files: z.array(FileUploadItemSchema).min(1).max(10),
});

export type RequestUploadBody = z.infer<typeof RequestUploadBodySchema>;

/**
 * Schema for confirming an upload is complete
 */
export const ConfirmUploadBodySchema = z.object({
  etag: z.string().optional(),
  checksum: z.string().optional(),
});

export type ConfirmUploadBody = z.infer<typeof ConfirmUploadBodySchema>;

/**
 * Query params for listing files
 */
export const ListFilesQuerySchema = z.object({
  status: FileStatusSchema.optional(),
});

export type ListFilesQuery = z.infer<typeof ListFilesQuerySchema>;

/**
 * Payload for file processing jobs sent to RabbitMQ
 */
export interface FileProcessJobPayload {
  file_id: string;
  object_key: string;
  user_id: string;
  enqueued_at: string;
}

/**
 * File record as stored in the database
 */
export interface FileRecord {
  id: string;
  user_id: string;
  original_filename: string;
  object_key: string;
  size_bytes: number;
  content_type: string;
  status: FileStatus;
  error_code: string | null;
  created_at: Date;
  enqueued_at: Date | null;
  processed_at: Date | null;
}

/**
 * Request to upload files - single file entry
 */
export interface FileUploadRequest {
  original_filename: string;
  size_bytes: number;
  content_type: string;
}

/**
 * Response with signed URL for uploading
 */
export interface FileUploadUrlResponse {
  file_id: string;
  object_key: string;
  upload_url: string;
  expires_at: string;
}

/**
 * Response for POST /files/uploads
 */
export interface RequestUploadResponse {
  files: FileUploadUrlResponse[];
}

/**
 * Response for POST /files/:file_id/upload-complete
 */
export interface ConfirmUploadResponse {
  file_id: string;
  status: FileStatus;
}

/**
 * File item in list response
 */
export interface FileListItem {
  id: string;
  filename: string;
  status: FileStatus;
  created_at: string;
  processed_at: string | null;
}

/**
 * Response for GET /files
 */
export interface ListFilesResponse {
  files: FileListItem[];
}

/**
 * LLM request record for rate limiting and observability
 */
export interface LlmRequestRecord {
  id: string;
  file_id: string;
  provider: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  started_at: Date;
  finished_at: Date | null;
  latency_ms: number | null;
  error_code: string | null;
  error_message: string | null;
}
