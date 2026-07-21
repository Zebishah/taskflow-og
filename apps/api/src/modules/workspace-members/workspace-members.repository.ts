import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  users,
  workspaceMembers,
  type WorkspaceMember,
  type WorkspaceRole,
} from '../../database/schema';
import type { WorkspaceMemberResponse } from './workspace-members.types';

@Injectable()
export class WorkspaceMembersRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async findAll(
    workspaceId: string,
  ): Promise<WorkspaceMemberResponse[]> {
    const rows = await this.database
      .select({
        id: workspaceMembers.id,
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        createdAt: workspaceMembers.createdAt,
        updatedAt: workspaceMembers.updatedAt,

        userIdValue: users.id,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userStatus: users.status,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .orderBy(asc(users.firstName), asc(users.lastName));

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      role: row.role,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      user: {
        id: row.userIdValue,
        email: row.userEmail,
        firstName: row.userFirstName,
        lastName: row.userLastName,
        status: row.userStatus,
      },
    }));
  }
  public async existsByEmail(
    workspaceId: string,
    email: string,
  ): Promise<boolean> {
    const [membership] = await this.database
      .select({
        id: workspaceMembers.id,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          sql`lower(${users.email}) = lower(${email})`,
        ),
      )
      .limit(1);

    return membership !== undefined;
  }

  public async findResponseByUserId(
    userId: string,
  ): Promise<WorkspaceMemberResponse | null> {
    const [row] = await this.database
      .select({
        id: workspaceMembers.id,
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        joinedAt: workspaceMembers.joinedAt,
        createdAt: workspaceMembers.createdAt,
        updatedAt: workspaceMembers.updatedAt,

        userIdValue: users.id,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userStatus: users.status,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.userId, userId))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      workspaceId: row.workspaceId,
      userId: row.userId,
      role: row.role,
      joinedAt: row.joinedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      user: {
        id: row.userIdValue,
        email: row.userEmail,
        firstName: row.userFirstName,
        lastName: row.userLastName,
        status: row.userStatus,
      },
    };
  }
  public async findById(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMember | null> {
    const [member] = await this.database
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, memberId),
        ),
      )
      .limit(1);

    return member ?? null;
  }

  public async findByUserId(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
    const [member] = await this.database
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .limit(1);

    return member ?? null;
  }

  public async updateRole(
    memberId: string,
    role: WorkspaceRole,
  ): Promise<WorkspaceMember | null> {
    const [member] = await this.database
      .update(workspaceMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(workspaceMembers.id, memberId))
      .returning();

    return member ?? null;
  }

  public async remove(memberId: string): Promise<boolean> {
    const deletedRows = await this.database
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId))
      .returning({
        id: workspaceMembers.id,
      });

    return deletedRows.length > 0;
  }
}
