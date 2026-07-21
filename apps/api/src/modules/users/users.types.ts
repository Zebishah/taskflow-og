import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { users } from 'src/database/schema';

export type UserRecord = InferSelectModel<typeof users>;

export type NewUserRecord = InferInsertModel<typeof users>;

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserRecord['status'];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}
