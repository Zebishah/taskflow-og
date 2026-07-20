import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { users } from '../database/schema';
import type { CreateUserInput, PublicUser, UserRecord } from './users.types';

@Injectable()
export class UsersService {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async findByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user ?? null;
  }

  public async findById(userId: string): Promise<UserRecord | null> {
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user ?? null;
  }

  public async create(input: CreateUserInput): Promise<UserRecord> {
    const [createdUser] = await this.database
      .insert(users)
      .values({
        email: input.email,
        passwordHash: input.passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      })
      .returning();

    if (!createdUser) {
      throw new Error('User creation returned no record');
    }

    return createdUser;
  }

  public toPublicUser(user: UserRecord): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
