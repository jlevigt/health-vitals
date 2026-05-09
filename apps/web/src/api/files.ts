import { api } from "./client";

export interface FileUploadRequest {
  original_filename: string;
  size_bytes: number;
  content_type: string;
}

export interface UploadResponse {
  file_id: string;
  upload_url: string;
  expires_at: string;
}

export const filesApi = {
  getUploadUrls: async (files: FileUploadRequest[]) => {
    // API response is { files: UploadResponse[] }
    const response = await api.post<{ files: UploadResponse[] }>("/files/uploads", { files });
    return response.data;
  },

  uploadFileToUrl: async (url: string, file: File) => {
    // We use fetch here because S3 signed URLs are very sensitive to
    // automated headers or transforms.
    const response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }
  },

  completeUpload: async (fileId: string) => {
    // API returns { file_id: string; status: string }
    const response = await api.post<{ file_id: string; status: string }>(
      `/files/${fileId}/upload-complete`,
      {},
    );
    return response.data;
  },
};
