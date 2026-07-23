import { relations } from 'drizzle-orm';

import { projects } from './projects.schema';
import { tasks } from './tasks.schema';
import { users } from './users.schema';
import { workspaceInvitations } from './workspace-invitations.schema';
import { workspaceMembers } from './workspace-members.schema';
import { workspaces } from './workspaces.schema';

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),

  invitations: many(workspaceInvitations),

  projects: many(projects),

  tasks: many(tasks),
}));

export const workspaceMembersRelations = relations(
  workspaceMembers,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),

    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),

    assignedTasks: many(tasks),
  }),
);
