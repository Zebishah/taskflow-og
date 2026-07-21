import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';
import { workspaceRoleEnum } from './workspace-role.enum';
import { workspaces } from './workspaces.schema';

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    role: workspaceRoleEnum('role').notNull().default('member'),

    joinedAt: timestamp('joined_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('workspace_members_workspace_user_unique_index').on(
      table.workspaceId,
      table.userId,
    ),

    index('workspace_members_workspace_id_index').on(table.workspaceId),

    index('workspace_members_user_id_index').on(table.userId),

    index('workspace_members_workspace_role_index').on(
      table.workspaceId,
      table.role,
    ),
  ],
);

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;

export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;
