import { relations } from 'drizzle-orm';

import { projects } from './projects.schema';
import { tasks } from './tasks.schema';
import { users } from './users.schema';
import { workspaceMembers } from './workspace-members.schema';
import { workspaces } from './workspaces.schema';

export const tasksRelations = relations(tasks, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),

  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),

  createdByUser: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
  }),

  assigneeMembership: one(workspaceMembers, {
    fields: [tasks.assigneeMemberId],
    references: [workspaceMembers.id],
  }),
}));
