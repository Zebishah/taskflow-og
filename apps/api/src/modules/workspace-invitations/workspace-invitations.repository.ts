import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, sql } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  users,
  workspaceInvitations,
  workspaceMembers,
  workspaces,
  type WorkspaceInvitation,
  type WorkspaceRole,
} from '../../database/schema';
import type {
  AcceptedInvitationResponse,
  WorkspaceInvitationResponse,
} from './workspace-invitations.types';

interface CreateInvitationInput {
  workspaceId: string;
  email: string;
  role: 'admin' | 'member';
  tokenHash: string;
  invitedByUserId: string;
  expiresAt: Date;
}

interface InvitationPreviewRow {
  invitation: WorkspaceInvitation;

  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };

  inviter: {
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class WorkspaceInvitationsRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async create(
    input: CreateInvitationInput,
  ): Promise<WorkspaceInvitation> {
    const [invitation] = await this.database
      .insert(workspaceInvitations)
      .values({
        workspaceId: input.workspaceId,
        email: input.email,
        role: input.role,
        tokenHash: input.tokenHash,
        invitedByUserId: input.invitedByUserId,
        expiresAt: input.expiresAt,
      })
      .returning();

    if (!invitation) {
      throw new Error('Invitation creation returned no record');
    }

    return invitation;
  }

  public async findAllForWorkspace(
    workspaceId: string,
  ): Promise<WorkspaceInvitationResponse[]> {
    const rows = await this.database
      .select({
        id: workspaceInvitations.id,
        workspaceId: workspaceInvitations.workspaceId,
        email: workspaceInvitations.email,
        role: workspaceInvitations.role,
        status: workspaceInvitations.status,
        expiresAt: workspaceInvitations.expiresAt,
        lastSentAt: workspaceInvitations.lastSentAt,
        createdAt: workspaceInvitations.createdAt,
        updatedAt: workspaceInvitations.updatedAt,

        inviterId: users.id,
        inviterFirstName: users.firstName,
        inviterLastName: users.lastName,
        inviterEmail: users.email,
      })
      .from(workspaceInvitations)
      .innerJoin(users, eq(workspaceInvitations.invitedByUserId, users.id))
      .where(eq(workspaceInvitations.workspaceId, workspaceId))
      .orderBy(asc(workspaceInvitations.createdAt));

    return rows.map((row) => ({
      id: row.id,
      workspaceId: row.workspaceId,
      email: row.email,
      role: row.role,
      status: row.status,
      expiresAt: row.expiresAt,
      lastSentAt: row.lastSentAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      invitedBy: {
        id: row.inviterId,
        firstName: row.inviterFirstName,
        lastName: row.inviterLastName,
        email: row.inviterEmail,
      },
    }));
  }

  public async findPendingByEmail(
    workspaceId: string,
    email: string,
  ): Promise<WorkspaceInvitation | null> {
    const [invitation] = await this.database
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspaceId),
          sql`lower(${workspaceInvitations.email}) = lower(${email})`,
          eq(workspaceInvitations.status, 'pending'),
        ),
      )
      .limit(1);

    return invitation ?? null;
  }

  public async findById(
    workspaceId: string,
    invitationId: string,
  ): Promise<WorkspaceInvitation | null> {
    const [invitation] = await this.database
      .select()
      .from(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.workspaceId, workspaceId),
          eq(workspaceInvitations.id, invitationId),
        ),
      )
      .limit(1);

    return invitation ?? null;
  }

  public async findPreviewByTokenHash(
    tokenHash: string,
  ): Promise<InvitationPreviewRow | null> {
    const [row] = await this.database
      .select({
        invitation: workspaceInvitations,

        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          description: workspaces.description,
        },

        inviter: {
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(workspaceInvitations)
      .innerJoin(
        workspaces,
        eq(workspaceInvitations.workspaceId, workspaces.id),
      )
      .innerJoin(users, eq(workspaceInvitations.invitedByUserId, users.id))
      .where(eq(workspaceInvitations.tokenHash, tokenHash))
      .limit(1);

    return row ?? null;
  }

  public async replaceToken(
    invitationId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<WorkspaceInvitation | null> {
    const now = new Date();

    const [invitation] = await this.database
      .update(workspaceInvitations)
      .set({
        tokenHash,
        expiresAt,
        lastSentAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.status, 'pending'),
        ),
      )
      .returning();

    return invitation ?? null;
  }

  public async cancel(invitationId: string): Promise<boolean> {
    const now = new Date();

    const updatedRows = await this.database
      .update(workspaceInvitations)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.status, 'pending'),
        ),
      )
      .returning({
        id: workspaceInvitations.id,
      });

    return updatedRows.length > 0;
  }

  public async decline(invitationId: string): Promise<boolean> {
    const now = new Date();

    const updatedRows = await this.database
      .update(workspaceInvitations)
      .set({
        status: 'declined',
        declinedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.status, 'pending'),
          gt(workspaceInvitations.expiresAt, now),
        ),
      )
      .returning({
        id: workspaceInvitations.id,
      });

    return updatedRows.length > 0;
  }

  public async accept(
    invitationId: string,
    userId: string,
    role: WorkspaceRole,
    workspaceId: string,
  ): Promise<AcceptedInvitationResponse> {
    return this.database.transaction(async (transaction) => {
      const now = new Date();

      /*
       * The conditional update acts as our race-safe
       * claim. Only one concurrent request can change
       * this pending invitation to accepted.
       */
      const [acceptedInvitation] = await transaction
        .update(workspaceInvitations)
        .set({
          status: 'accepted',
          acceptedByUserId: userId,
          acceptedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(workspaceInvitations.id, invitationId),
            eq(workspaceInvitations.status, 'pending'),
            gt(workspaceInvitations.expiresAt, now),
          ),
        )
        .returning();

      if (!acceptedInvitation) {
        throw new Error('INVITATION_NOT_ACCEPTABLE');
      }

      const [membership] = await transaction
        .insert(workspaceMembers)
        .values({
          workspaceId,
          userId,
          role,
        })
        .onConflictDoNothing({
          target: [workspaceMembers.workspaceId, workspaceMembers.userId],
        })
        .returning();

      if (!membership) {
        throw new Error('MEMBERSHIP_ALREADY_EXISTS');
      }

      return {
        workspaceId,
        membershipId: membership.id,
        role: membership.role,
      };
    });
  }
  public async deletePendingByTokenHash(
    invitationId: string,
    tokenHash: string,
  ): Promise<boolean> {
    const deletedRows = await this.database
      .delete(workspaceInvitations)
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.tokenHash, tokenHash),
          eq(workspaceInvitations.status, 'pending'),
        ),
      )
      .returning({
        id: workspaceInvitations.id,
      });

    return deletedRows.length > 0;
  }

  public async restoreTokenAfterQueueFailure(
    invitationId: string,
    failedTokenHash: string,
    previousTokenHash: string,
    previousExpiresAt: Date,
    previousLastSentAt: Date,
  ): Promise<boolean> {
    const [restoredInvitation] = await this.database
      .update(workspaceInvitations)
      .set({
        tokenHash: previousTokenHash,
        expiresAt: previousExpiresAt,
        lastSentAt: previousLastSentAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(workspaceInvitations.id, invitationId),
          eq(workspaceInvitations.tokenHash, failedTokenHash),
          eq(workspaceInvitations.status, 'pending'),
        ),
      )
      .returning({
        id: workspaceInvitations.id,
      });

    return restoredInvitation !== undefined;
  }
}
