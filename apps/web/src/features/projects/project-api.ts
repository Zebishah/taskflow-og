import { WorkspaceApiError } from "../workspaces/workspace-api";

import type {
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "./project.types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  accessToken: string;
  body?: unknown;
}

async function projectRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const { accessToken, body, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    credentials: "include",

    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,

      ...(body !== undefined
        ? {
            "Content-Type": "application/json",
          }
        : {}),

      ...headers,
    },

    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorResponse: ApiErrorResponse | undefined;

    try {
      errorResponse = (await response.json()) as ApiErrorResponse;
    } catch {
      errorResponse = undefined;
    }

    const rawMessage =
      errorResponse?.message ?? `Request failed with status ${response.status}`;

    const messages = Array.isArray(rawMessage) ? rawMessage : [rawMessage];

    throw new WorkspaceApiError(response.status, messages);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getProjects(
  workspaceId: string,
  accessToken: string,
): Promise<Project[]> {
  return projectRequest<Project[]>(`/workspaces/${workspaceId}/projects`, {
    method: "GET",
    accessToken,
  });
}

export function getProject(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<Project> {
  return projectRequest<Project>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createProject(
  workspaceId: string,
  input: CreateProjectInput,
  accessToken: string,
): Promise<Project> {
  return projectRequest<Project>(`/workspaces/${workspaceId}/projects`, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updateProject(
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput,
  accessToken: string,
): Promise<Project> {
  return projectRequest<Project>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export async function archiveProject(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<void> {
  await projectRequest<void>(
    `/workspaces/${workspaceId}/projects/${projectId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}

export function restoreProject(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<Project> {
  return projectRequest<Project>(
    `/workspaces/${workspaceId}/projects/${projectId}/restore`,
    {
      method: "PATCH",
      accessToken,
    },
  );
}
