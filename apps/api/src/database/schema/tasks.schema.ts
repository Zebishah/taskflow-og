import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { projects } from './projects.schema';
import { taskPriorityEnum } from './task-priority.enum';
import {
  foreignKey,
  // existing imports...
} from 'drizzle-orm/pg-core';

import { projectColumns } from './project-columns.schema';
import { users } from './users.schema';
import { workspaceMembers } from './workspace-members.schema';
import { workspaces } from './workspaces.schema';

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      }),

    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, {
        onDelete: 'cascade',
      }),

    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
      }),

    assigneeMemberId: uuid('assignee_member_id').references(
      () => workspaceMembers.id,
      {
        onDelete: 'set null',
      },
    ),

    taskNumber: integer('task_number').notNull(),

    title: varchar('title', {
      length: 200,
    }).notNull(),

    description: text('description'),

    columnId: uuid('column_id').notNull(),

    priority: taskPriorityEnum('priority').default('medium').notNull(),

    /*
     * This gives tasks a stable ordering within
     * their current status column.
     */
    position: integer('position').default(1000).notNull(),

    dueAt: timestamp('due_at', {
      withTimezone: true,
      mode: 'date',
    }),

    /*
     * When the assignee should receive a due reminder.
     * Managed by TaskReminderScheduleService (cron replaces BullMQ).
     */
    reminderAt: timestamp('reminder_at', {
      withTimezone: true,
      mode: 'date',
    }),

    reminderSentAt: timestamp('reminder_sent_at', {
      withTimezone: true,
      mode: 'date',
    }),

    completedAt: timestamp('completed_at', {
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
    imageKey: varchar('image_key', {
      length: 1_024,
    }),

    imageOriginalName: varchar('image_original_name', {
      length: 255,
    }),

    imageContentType: varchar('image_content_type', {
      length: 100,
    }),

    imageSizeBytes: integer('image_size_bytes'),
  },
  (table) => [
    uniqueIndex('tasks_project_task_number_unique_index').on(
      table.projectId,
      table.taskNumber,
    ),
    check(
      'tasks_image_size_positive_check',
      sql`${table.imageSizeBytes} IS NULL OR ${table.imageSizeBytes} > 0`,
    ),
    check('tasks_task_number_positive_check', sql`${table.taskNumber} > 0`),

    check('tasks_position_non_negative_check', sql`${table.position} >= 0`),

    index('tasks_workspace_id_index').on(table.workspaceId),

    index('tasks_project_id_index').on(table.projectId),

    index('tasks_project_column_position_index').on(
      table.projectId,
      table.columnId,
      table.position,
    ),
    foreignKey({
      columns: [table.projectId, table.columnId],
      foreignColumns: [projectColumns.projectId, projectColumns.id],
      name: 'tasks_project_column_foreign_key',
    }).onDelete('restrict'),
    index('tasks_workspace_assignee_index').on(
      table.workspaceId,
      table.assigneeMemberId,
    ),

    index('tasks_workspace_priority_index').on(
      table.workspaceId,
      table.priority,
    ),

    index('tasks_due_at_index').on(table.dueAt),

    index('tasks_reminder_at_pending_index').on(table.reminderAt),

    index('tasks_created_by_user_id_index').on(table.createdByUserId),
  ],
);

export type Task = typeof tasks.$inferSelect;

export type NewTask = typeof tasks.$inferInsert;
