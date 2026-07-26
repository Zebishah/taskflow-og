export const allowedTaskImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const maximumTaskImageBytes = 5 * 1024 * 1024;

export interface TaskImageUploadIntent {
  objectKey: string;
  uploadUrl: string;
  fields: Record<string, string>;
  expiresInSeconds: number;
}

export interface TaskImage {
  originalName: string;
  contentType: string;
  sizeBytes: number;
  downloadUrl: string;
}
