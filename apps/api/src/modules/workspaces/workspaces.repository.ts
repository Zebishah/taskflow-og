import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  workspaceMembers,
  workspaces,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
} from '../../database/schema';

interface CreateWorkspaceWithOwnerInput {
  creatorId: string;
  name: string;
  slug: string;
  description: string | null;
}

interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
  description?: string | null;
}

interface WorkspaceAndMembership {
  workspace: Workspace;
  membership: WorkspaceMember;
}

interface UserWorkspaceResult {
  workspace: Workspace;
  role: WorkspaceRole;
}

@Injectable()
export class WorkspacesRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async createWithOwner(
    input: CreateWorkspaceWithOwnerInput,
  ): Promise<WorkspaceAndMembership> {
    return this.database.transaction(async (transaction) => {
      const [workspace] = await transaction
        .insert(workspaces)
        .values({
          name: input.name,
          slug: input.slug,
          description: input.description,
        })
        .returning();

      if (!workspace) {
        throw new Error('Workspace creation returned no record');
      }

      const [membership] = await transaction
        .insert(workspaceMembers)
        .values({
          workspaceId: workspace.id,
          userId: input.creatorId,
          role: 'owner',
        })
        .returning();

      if (!membership) {
        throw new Error('Owner membership creation returned no record');
      }

      return {
        workspace,
        membership,
      };
    });
  }

  public async findById(workspaceId: string): Promise<Workspace | null> {
    const [workspace] = await this.database
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    return workspace ?? null;
  }

  public async findBySlug(slug: string): Promise<Workspace | null> {
    const [workspace] = await this.database
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);

    return workspace ?? null;
  }

  public async findWorkspaceAndMembership(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceAndMembership | null> {
    const [result] = await this.database
      .select({
        workspace: workspaces,
        membership: workspaceMembers,
      })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.workspaceId, workspaces.id),
          eq(workspaceMembers.userId, userId),
        ),
      )
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    return result ?? null;
  }

  public async findAllForUser(userId: string): Promise<UserWorkspaceResult[]> {
    return this.database
      .select({
        workspace: workspaces,
        role: workspaceMembers.role,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(asc(workspaces.name));
  }

  public async countMembers(workspaceId: string): Promise<number> {
    const [result] = await this.database
      .select({
        total: count(),
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return Number(result?.total ?? 0);
  }

  public async update(
    workspaceId: string,
    input: UpdateWorkspaceInput,
  ): Promise<Workspace | null> {
    const [workspace] = await this.database
      .update(workspaces)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return workspace ?? null;
  }

  public async delete(workspaceId: string): Promise<boolean> {
    const deletedRows = await this.database
      .delete(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .returning({
        id: workspaces.id,
      });

    return deletedRows.length > 0;
  }
}
