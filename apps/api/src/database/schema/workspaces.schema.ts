import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: varchar('name', {
      length: 100,
    }).notNull(),

    slug: varchar('slug', {
      length: 100,
    }).notNull(),

    description: text('description'),

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
    uniqueIndex('workspaces_slug_unique_index').on(table.slug),

    index('workspaces_created_at_index').on(table.createdAt),
  ],
);

export type Workspace = typeof workspaces.$inferSelect;

export type NewWorkspace = typeof workspaces.$inferInsert;
