import { WorkspaceApiError } from "../workspaces/workspace-api";

import type {
  CreateTaskInput,
  Task,
  TaskFilters,
  UpdateTaskInput,
} from "./task.types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  accessToken: string;
  body?: unknown;
}

export async function taskRequest<T>(
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

function buildTaskQueryString(filters: TaskFilters): string {
  const searchParameters = new URLSearchParams();

  if (filters.columnId) {
    searchParameters.set("columnId", filters.columnId);
  }

  if (filters.priority) {
    searchParameters.set("priority", filters.priority);
  }

  if (filters.assigneeMemberId) {
    searchParameters.set("assigneeMemberId", filters.assigneeMemberId);
  }

  if (filters.search?.trim()) {
    searchParameters.set("search", filters.search.trim());
  }

  const queryString = searchParameters.toString();

  return queryString ? `?${queryString}` : "";
}

export function getTaskBasePath(
  workspaceId: string,
  projectId: string,
): string {
  return `/workspaces/${workspaceId}` + `/projects/${projectId}/tasks`;
}

export function getTasks(
  workspaceId: string,
  projectId: string,
  filters: TaskFilters,
  accessToken: string,
): Promise<Task[]> {
  const queryString = buildTaskQueryString(filters);

  return taskRequest<Task[]>(
    `${getTaskBasePath(workspaceId, projectId)}${queryString}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function getTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  accessToken: string,
): Promise<Task> {
  return taskRequest<Task>(
    `${getTaskBasePath(workspaceId, projectId)}/${taskId}`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createTask(
  workspaceId: string,
  projectId: string,
  input: CreateTaskInput,
  accessToken: string,
): Promise<Task> {
  return taskRequest<Task>(getTaskBasePath(workspaceId, projectId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updateTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  input: UpdateTaskInput,
  accessToken: string,
): Promise<Task> {
  return taskRequest<Task>(
    `${getTaskBasePath(workspaceId, projectId)}/${taskId}`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export async function deleteTask(
  workspaceId: string,
  projectId: string,
  taskId: string,
  accessToken: string,
): Promise<void> {
  await taskRequest<void>(
    `${getTaskBasePath(workspaceId, projectId)}/${taskId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}
