import { WorkspaceApiError } from "../workspaces/workspace-api";

import type {
  AcceptedInvitation,
  CreateInvitationInput,
  InvitationPreview,
  UpdateMemberRoleInput,
  WorkspaceInvitation,
  WorkspaceMember,
} from "./workspace-collaboration.types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  accessToken?: string;
  body?: unknown;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { accessToken, body, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    credentials: "include",

    headers: {
      Accept: "application/json",

      ...(accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {}),

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

export function getWorkspaceMembers(
  workspaceId: string,
  accessToken: string,
): Promise<WorkspaceMember[]> {
  return request<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`, {
    method: "GET",
    accessToken,
  });
}

export function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  input: UpdateMemberRoleInput,
  accessToken: string,
): Promise<WorkspaceMember> {
  return request<WorkspaceMember>(
    `/workspaces/${workspaceId}/members/${memberId}/role`,
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
  accessToken: string,
): Promise<void> {
  return request<void>(`/workspaces/${workspaceId}/members/${memberId}`, {
    method: "DELETE",
    accessToken,
  });
}

export function getWorkspaceInvitations(
  workspaceId: string,
  accessToken: string,
): Promise<WorkspaceInvitation[]> {
  return request<WorkspaceInvitation[]>(
    `/workspaces/${workspaceId}/invitations`,
    {
      method: "GET",
      accessToken,
    },
  );
}

export function createWorkspaceInvitation(
  workspaceId: string,
  input: CreateInvitationInput,
  accessToken: string,
): Promise<WorkspaceInvitation> {
  return request<WorkspaceInvitation>(
    `/workspaces/${workspaceId}/invitations`,
    {
      method: "POST",
      accessToken,
      body: input,
    },
  );
}

export function resendWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
  accessToken: string,
): Promise<void> {
  return request<void>(
    `/workspaces/${workspaceId}/invitations/${invitationId}/resend`,
    {
      method: "POST",
      accessToken,
    },
  );
}

export function cancelWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
  accessToken: string,
): Promise<void> {
  return request<void>(
    `/workspaces/${workspaceId}/invitations/${invitationId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
}

export function getInvitationPreview(
  token: string,
): Promise<InvitationPreview> {
  return request<InvitationPreview>(
    `/invitations/${encodeURIComponent(token)}`,
    {
      method: "GET",
    },
  );
}

export function acceptWorkspaceInvitation(
  token: string,
  accessToken: string,
): Promise<AcceptedInvitation> {
  return request<AcceptedInvitation>(
    `/invitations/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      accessToken,
    },
  );
}

export function declineWorkspaceInvitation(
  token: string,
  accessToken: string,
): Promise<void> {
  return request<void>(`/invitations/${encodeURIComponent(token)}/decline`, {
    method: "POST",
    accessToken,
  });
}
