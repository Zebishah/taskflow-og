import { pgEnum } from 'drizzle-orm/pg-core';

export const projectColumnColorValues = [
  'slate',
  'blue',
  'violet',
  'amber',
  'emerald',
  'rose',
  'cyan',
  'indigo',
] as const;

export type ProjectColumnColor = (typeof projectColumnColorValues)[number];

export const projectColumnColorEnum = pgEnum(
  'project_column_color',
  projectColumnColorValues,
);
