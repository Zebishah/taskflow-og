import type { WorkspaceRole } from "../workspaces/workspace.types";

export const assignableWorkspaceRoles = ["admin", "member"] as const;

export type AssignableWorkspaceRole = (typeof assignableWorkspaceRoles)[number];

export const workspaceInvitationStatuses = [
  "pending",
  "accepted",
  "declined",
  "cancelled",
] as const;

export type WorkspaceInvitationStatus =
  (typeof workspaceInvitationStatuses)[number];

export type InvitationPreviewStatus = WorkspaceInvitationStatus | "expired";

export interface WorkspaceMemberUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: "active" | "disabled";
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: WorkspaceMemberUser;
}

export interface InvitationInviter {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceInvitationStatus;
  expiresAt: string;
  lastSentAt: string;
  createdAt: string;
  updatedAt: string;
  invitedBy: InvitationInviter;
}

export interface InvitationWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface InvitationPreview {
  workspace: InvitationWorkspace;

  inviter: {
    firstName: string;
    lastName: string;
  };

  recipientEmail: string;
  role: WorkspaceRole;
  status: InvitationPreviewStatus;
  expiresAt: string;
}

export interface AcceptedInvitation {
  workspaceId: string;
  membershipId: string;
  role: WorkspaceRole;
}

export interface CreateInvitationInput {
  email: string;
  role: AssignableWorkspaceRole;
}

export interface UpdateMemberRoleInput {
  role: AssignableWorkspaceRole;
}
