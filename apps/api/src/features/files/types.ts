import { z } from "zod";

/**
 * Schema for a single file upload request
 */
export const FileUploadItemSchema = z.object({
  original_filename: z.string().min(1).max(255),
  size_bytes: z.number().positive().max(50 * 1024 * 1024), // Max 50MB
  content_type: z.string().default("application/pdf"),
});

/**
 * Schema for the POST /files/uploads request body
 */
export const RequestUploadBodySchema = z.object({
  files: z.array(FileUploadItemSchema).min(1).max(10),
});

export type RequestUploadBody = z.infer<typeof RequestUploadBodySchema>;
export type FileUploadItem = z.infer<typeof FileUploadItemSchema>;

/**
 * Response for a single file upload URL
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
 * Schema for POST /files/:file_id/upload-complete
 */
export const ConfirmUploadBodySchema = z.object({
  etag: z.string().optional(),
  checksum: z.string().optional(),
});

export type ConfirmUploadBody = z.infer<typeof ConfirmUploadBodySchema>;

/**
 * Response for POST /files/:file_id/upload-complete
 */
export interface ConfirmUploadResponse {
  file_id: string;
  status: string;
}

/**
 * Query params for GET /files
 */
export const ListFilesQuerySchema = z.object({
  status: z.enum([
    "CREATED",
    "QUEUED", 
    "PROCESSING",
    "SUCCEEDED",
    "FAILED_RETRYABLE",
    "FAILED_TERMINAL",
  ]).optional(),
});

export type ListFilesQuery = z.infer<typeof ListFilesQuerySchema>;

/**
 * File item in list response
 */
export interface FileListItem {
  id: string;
  filename: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}
