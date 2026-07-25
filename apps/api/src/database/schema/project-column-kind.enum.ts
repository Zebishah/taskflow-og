import { pgEnum } from 'drizzle-orm/pg-core';

export const projectColumnKindValues = ['backlog', 'active', 'done'] as const;

export type ProjectColumnKind = (typeof projectColumnKindValues)[number];

export const projectColumnKindEnum = pgEnum(
  'project_column_kind',
  projectColumnKindValues,
);
