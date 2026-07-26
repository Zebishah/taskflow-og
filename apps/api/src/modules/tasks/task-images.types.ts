export interface TaskImageUploadIntent {
  objectKey: string;
  uploadUrl: string;
  fields: Record<string, string>;
  expiresInSeconds: number;
}

export interface TaskImageResponse {
  originalName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
}
