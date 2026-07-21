import { relations } from 'drizzle-orm';

import { authSessions } from './auth-sessions.schema';
import { users } from './users.schema';
import { workspaceMembers } from './workspace-members.schema';
import { workspaceInvitations } from './workspace-invitations.schema';

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(authSessions),
  workspaceMemberships: many(workspaceMembers),
  sentWorkspaceInvitations: many(workspaceInvitations, {
    relationName: 'workspaceInvitationInviter',
  }),
  acceptedWorkspaceInvitations: many(workspaceInvitations, {
    relationName: 'workspaceInvitationAcceptor',
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, {
    fields: [authSessions.userId],
    references: [users.id],
  }),
}));
