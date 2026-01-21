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
