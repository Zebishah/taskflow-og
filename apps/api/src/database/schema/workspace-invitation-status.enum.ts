import { pgEnum } from 'drizzle-orm/pg-core';

export const workspaceInvitationStatusValues = [
  'pending',
  'accepted',
  'declined',
  'cancelled',
] as const;

export type WorkspaceInvitationStatus =
  (typeof workspaceInvitationStatusValues)[number];

export const workspaceInvitationStatusEnum = pgEnum(
  'workspace_invitation_status',
  workspaceInvitationStatusValues,
);
