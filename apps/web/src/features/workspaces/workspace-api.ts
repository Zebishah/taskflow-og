import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceApiErrorResponse,
  WorkspaceDetails,
} from "./workspace.types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class WorkspaceApiError extends Error {
  public readonly statusCode: number;

  public readonly messages: string[];

  public constructor(statusCode: number, messages: string[]) {
    super(messages[0] ?? "Workspace request failed");

    this.name = "WorkspaceApiError";
    this.statusCode = statusCode;
    this.messages = messages;
  }
}

interface WorkspaceRequestOptions extends Omit<RequestInit, "body"> {
  accessToken: string;
  body?: unknown;
}

async function workspaceRequest<T>(
  path: string,
  options: WorkspaceRequestOptions,
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
    let errorResponse: WorkspaceApiErrorResponse | undefined;

    try {
      errorResponse = (await response.json()) as WorkspaceApiErrorResponse;
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

export async function getWorkspaces(accessToken: string): Promise<Workspace[]> {
  return workspaceRequest<Workspace[]>("/workspaces", {
    method: "GET",
    accessToken,
  });
}

export async function getWorkspace(
  workspaceId: string,
  accessToken: string,
): Promise<WorkspaceDetails> {
  return workspaceRequest<WorkspaceDetails>(`/workspaces/${workspaceId}`, {
    method: "GET",
    accessToken,
  });
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  accessToken: string,
): Promise<Workspace> {
  return workspaceRequest<Workspace>("/workspaces", {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
  accessToken: string,
): Promise<Workspace> {
  return workspaceRequest<Workspace>(`/workspaces/${workspaceId}`, {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function deleteWorkspace(
  workspaceId: string,
  accessToken: string,
): Promise<void> {
  await workspaceRequest<void>(`/workspaces/${workspaceId}`, {
    method: "DELETE",
    accessToken,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getMessageFromResponseData(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  const message = value.message;

  if (typeof message === "string") {
    return message;
  }

  if (
    Array.isArray(message) &&
    message.every((item): item is string => typeof item === "string")
  ) {
    return message.join(". ");
  }

  return null;
}

export function getWorkspaceErrorMessage(error: unknown): string {
  /*
   * Errors produced by the old custom API client.
   */
  if (error instanceof WorkspaceApiError) {
    return error.messages.join(". ");
  }

  /*
   * Errors returned by RTK Query fetchBaseQuery.
   *
   * Their common shape is:
   * {
   *   status: 400,
   *   data: {
   *     message: "..."
   *   }
   * }
   */
  if (isRecord(error) && "data" in error) {
    const message = getMessageFromResponseData(error.data);

    if (message) {
      return message;
    }
  }

  /*
   * Serialized RTK Query errors may contain
   * a direct string error property.
   */
  if (isRecord(error) && typeof error.error === "string") {
    return error.error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}
