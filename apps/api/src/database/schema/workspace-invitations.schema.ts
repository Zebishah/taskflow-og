import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { users } from './users.schema';
import { workspaceInvitationStatusEnum } from './workspace-invitation-status.enum';
import { workspaceRoleEnum } from './workspace-role.enum';
import { workspaces } from './workspaces.schema';

export const workspaceInvitations = pgTable(
  'workspace_invitations',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, {
        onDelete: 'cascade',
      }),

    email: varchar('email', {
      length: 320,
    }).notNull(),

    role: workspaceRoleEnum('role').notNull(),

    tokenHash: varchar('token_hash', {
      length: 64,
    }).notNull(),

    status: workspaceInvitationStatusEnum('status')
      .default('pending')
      .notNull(),

    invitedByUserId: uuid('invited_by_user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'restrict',
      }),

    acceptedByUserId: uuid('accepted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),

    acceptedAt: timestamp('accepted_at', {
      withTimezone: true,
      mode: 'date',
    }),

    declinedAt: timestamp('declined_at', {
      withTimezone: true,
      mode: 'date',
    }),

    cancelledAt: timestamp('cancelled_at', {
      withTimezone: true,
      mode: 'date',
    }),

    lastSentAt: timestamp('last_sent_at', {
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
    uniqueIndex('workspace_invitations_token_hash_unique_index').on(
      table.tokenHash,
    ),

    /*
     * Only one pending invitation may exist for the
     * same normalized email inside the same workspace.
     */
    uniqueIndex('workspace_invitations_pending_email_unique_index')
      .on(table.workspaceId, sql`lower(${table.email})`)
      .where(sql`${table.status} = 'pending'`),

    index('workspace_invitations_workspace_status_index').on(
      table.workspaceId,
      table.status,
    ),

    index('workspace_invitations_email_index').on(sql`lower(${table.email})`),

    index('workspace_invitations_expires_at_index').on(table.expiresAt),
  ],
);

export type WorkspaceInvitation = typeof workspaceInvitations.$inferSelect;

export type NewWorkspaceInvitation = typeof workspaceInvitations.$inferInsert;
