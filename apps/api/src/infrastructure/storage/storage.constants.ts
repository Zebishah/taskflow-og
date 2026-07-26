export const S3_CLIENT = Symbol('S3_CLIENT');

export const allowedTaskImageContentTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type TaskImageContentType =
  (typeof allowedTaskImageContentTypes)[number];

export const taskImageExtensions: Record<TaskImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
