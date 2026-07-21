import { relations } from 'drizzle-orm';

import { users } from './users.schema';
import { workspaceInvitations } from './workspace-invitations.schema';
import { workspaces } from './workspaces.schema';

export const workspaceInvitationsRelations = relations(
  workspaceInvitations,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [workspaceInvitations.workspaceId],
      references: [workspaces.id],
    }),

    invitedBy: one(users, {
      fields: [workspaceInvitations.invitedByUserId],
      references: [users.id],
      relationName: 'workspaceInvitationInviter',
    }),

    acceptedBy: one(users, {
      fields: [workspaceInvitations.acceptedByUserId],
      references: [users.id],
      relationName: 'workspaceInvitationAcceptor',
    }),
  }),
);
