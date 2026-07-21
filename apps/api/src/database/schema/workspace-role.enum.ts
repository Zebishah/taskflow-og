import { pgEnum } from 'drizzle-orm/pg-core';

export const workspaceRoleValues = ['owner', 'admin', 'member'] as const;

export type WorkspaceRole = (typeof workspaceRoleValues)[number];

export const workspaceRoleEnum = pgEnum('workspace_role', workspaceRoleValues);
