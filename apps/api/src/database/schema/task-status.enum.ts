import { pgEnum } from 'drizzle-orm/pg-core';

export const taskStatusValues = [
  'backlog',
  'todo',
  'in_progress',
  'in_review',
  'done',
] as const;

export type TaskStatus = (typeof taskStatusValues)[number];

export const taskStatusEnum = pgEnum('task_status', taskStatusValues);
