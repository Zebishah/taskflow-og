import { getTaskBasePath, taskRequest } from "./task-api";
import type { TaskImage, TaskImageUploadIntent } from "./task-image.types";

function getTaskImagePath(
  workspaceId: string,
  projectId: string,
  taskId: string,
): string {
  return `${getTaskBasePath(workspaceId, projectId)}/${taskId}/image`;
}

export function createTaskImageUploadIntent(
  workspaceId: string,
  projectId: string,
  taskId: string,
  file: File,
  accessToken: string,
): Promise<TaskImageUploadIntent> {
  return taskRequest<TaskImageUploadIntent>(
    `${getTaskImagePath(workspaceId, projectId, taskId)}/upload-intent`,
    {
      method: "POST",
      accessToken,

      body: {
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      },
    },
  );
}

export async function uploadTaskImageToS3(
  intent: TaskImageUploadIntent,
  file: File,
): Promise<void> {
  const formData = new FormData();

  for (const [name, value] of Object.entries(intent.fields)) {
    formData.append(name, value);
  }

  formData.append("file", file);

  const response = await fetch(intent.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`S3 upload failed with status ${response.status}`);
  }
}

export function confirmTaskImageUpload(
  workspaceId: string,
  projectId: string,
  taskId: string,
  objectKey: string,
  accessToken: string,
): Promise<TaskImage> {
  return taskRequest<TaskImage>(
    `${getTaskImagePath(workspaceId, projectId, taskId)}/confirm`,
    {
      method: "POST",
      accessToken,
      body: {
        objectKey,
      },
    },
  );
}

export function getTaskImage(
  workspaceId: string,
  projectId: string,
  taskId: string,
  accessToken: string,
): Promise<TaskImage> {
  return taskRequest<TaskImage>(
    getTaskImagePath(workspaceId, projectId, taskId),
    {
      method: "GET",
      accessToken,
    },
  );
}

export async function deleteTaskImage(
  workspaceId: string,
  projectId: string,
  taskId: string,
  accessToken: string,
): Promise<void> {
  await taskRequest<void>(getTaskImagePath(workspaceId, projectId, taskId), {
    method: "DELETE",
    accessToken,
  });
}
