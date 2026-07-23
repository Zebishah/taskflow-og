import { sql } from 'drizzle-orm';
import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { userStatusEnum } from './user-status.enum';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    email: varchar('email', {
      length: 320,
    }).notNull(),

    passwordHash: varchar('password_hash', {
      length: 255,
    }).notNull(),

    firstName: varchar('first_name', {
      length: 100,
    }).notNull(),

    lastName: varchar('last_name', {
      length: 100,
    }).notNull(),

    status: userStatusEnum('status').default('active').notNull(),

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
    uniqueIndex('users_email_unique_index').on(sql`lower(${table.email})`),

    index('users_status_index').on(table.status),
  ],
);
export type User = typeof users.$inferSelect;

export type NewUser = typeof users.$inferInsert;
