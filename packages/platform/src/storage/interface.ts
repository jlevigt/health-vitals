/**
 * Storage client interface for dependency injection
 */
export interface StorageClient {
  uploadFile(bucket: string, key: string, body: Buffer, contentType?: string): Promise<void>;
  getFile(bucket: string, key: string): Promise<Buffer>;
  deleteFile(bucket: string, key: string): Promise<void>;
  listFiles(bucket: string, prefix?: string): Promise<string[]>;
  getSignedUploadUrl(
    bucket: string,
    key: string,
    expiresIn?: number,
    contentType?: string,
  ): Promise<string>;
  getSignedDownloadUrl(bucket: string, key: string, expiresIn?: number): Promise<string>;
  checkConnection(): Promise<boolean>;
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle?: boolean;
}
