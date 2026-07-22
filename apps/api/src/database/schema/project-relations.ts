import { relations } from 'drizzle-orm';

import { projects } from './projects.schema';
import { users } from './users.schema';
import { workspaces } from './workspaces.schema';

export const projectsRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),

  createdByUser: one(users, {
    fields: [projects.createdByUserId],
    references: [users.id],
  }),
}));
