import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { projectColumnColorEnum } from './project-column-color.enum';
import { projectColumnKindEnum } from './project-column-kind.enum';
import { projects } from './projects.schema';

export const projectColumns = pgTable(
  'project_columns',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, {
        onDelete: 'cascade',
      }),

    name: varchar('name', {
      length: 50,
    }).notNull(),

    color: projectColumnColorEnum('color').default('slate').notNull(),

    kind: projectColumnKindEnum('kind').default('active').notNull(),

    position: integer('position').notNull(),

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
    check(
      'project_columns_position_non_negative_check',
      sql`${table.position} >= 0`,
    ),

    uniqueIndex('project_columns_project_name_unique_index').on(
      table.projectId,
      sql`lower(${table.name})`,
    ),

    uniqueIndex('project_columns_project_position_unique_index').on(
      table.projectId,
      table.position,
    ),

    /*
     * This must be a table-level unique constraint.
     * The tasks composite foreign key depends on it.
     */
    unique('project_columns_project_id_id_unique').on(
      table.projectId,
      table.id,
    ),

    index('project_columns_project_id_index').on(table.projectId),
  ],
);

export type ProjectColumn = typeof projectColumns.$inferSelect;

export type NewProjectColumn = typeof projectColumns.$inferInsert;
