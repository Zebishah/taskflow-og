import { pgEnum } from 'drizzle-orm/pg-core';

export const taskPriorityValues = ['low', 'medium', 'high', 'urgent'] as const;

export type TaskPriority = (typeof taskPriorityValues)[number];

export const taskPriorityEnum = pgEnum('task_priority', taskPriorityValues);
