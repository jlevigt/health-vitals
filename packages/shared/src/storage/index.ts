// Re-exports for clean imports
export type { StorageClient, StorageConfig } from "./interface.ts";
export { createStorageClient, Buckets } from "./s3.ts";
export type { BucketName } from "./s3.ts";
