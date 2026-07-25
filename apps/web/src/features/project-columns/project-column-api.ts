import type {
  CreateProjectColumnInput,
  ProjectColumn,
  UpdateProjectColumnInput,
} from "./project-column.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  accessToken: string;
  body?: unknown;
}

async function columnRequest<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",

    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);

    throw payload instanceof Object
      ? payload
      : new Error("Project column request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function basePath(workspaceId: string, projectId: string): string {
  return `/workspaces/${workspaceId}/projects/${projectId}/columns`;
}

export function getProjectColumns(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<ProjectColumn[]> {
  return columnRequest(basePath(workspaceId, projectId), {
    accessToken,
  });
}

export function createProjectColumn(
  workspaceId: string,
  projectId: string,
  input: CreateProjectColumnInput,
  accessToken: string,
): Promise<ProjectColumn> {
  return columnRequest(basePath(workspaceId, projectId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export function updateProjectColumn(
  workspaceId: string,
  projectId: string,
  columnId: string,
  input: UpdateProjectColumnInput,
  accessToken: string,
): Promise<ProjectColumn> {
  return columnRequest(`${basePath(workspaceId, projectId)}/${columnId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export function reorderProjectColumns(
  workspaceId: string,
  projectId: string,
  columnIds: string[],
  accessToken: string,
): Promise<ProjectColumn[]> {
  return columnRequest(`${basePath(workspaceId, projectId)}/reorder`, {
    method: "PATCH",
    accessToken,
    body: {
      columnIds,
    },
  });
}

export function deleteProjectColumn(
  workspaceId: string,
  projectId: string,
  columnId: string,
  moveTasksToColumnId: string | undefined,
  accessToken: string,
): Promise<void> {
  const search = new URLSearchParams();

  if (moveTasksToColumnId) {
    search.set("moveTasksToColumnId", moveTasksToColumnId);
  }

  const query = search.size > 0 ? `?${search}` : "";

  return columnRequest(
    `${basePath(workspaceId, projectId)}/${columnId}${query}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}
