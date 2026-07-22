import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';
import { workspaces } from './workspaces.schema';

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      }),

    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
      }),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    key: varchar('key', {
      length: 10,
    }).notNull(),

    description: text('description'),

    archivedAt: timestamp('archived_at', {
      withTimezone: true,
      mode: 'date',
    }),

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
    uniqueIndex('projects_workspace_key_unique_index').on(
      table.workspaceId,
      table.key,
    ),

    index('projects_workspace_id_index').on(table.workspaceId),

    index('projects_created_by_user_id_index').on(table.createdByUserId),

    index('projects_workspace_archived_at_index').on(
      table.workspaceId,
      table.archivedAt,
    ),

    index('projects_workspace_name_index').on(table.workspaceId, table.name),
  ],
);

export type Project = typeof projects.$inferSelect;

export type NewProject = typeof projects.$inferInsert;
