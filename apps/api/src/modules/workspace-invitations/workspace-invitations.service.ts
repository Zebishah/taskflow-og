import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';

import type { AccessTokenPayload } from '../auth/auth.types';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { WorkspaceMembersRepository } from '../workspace-members/workspace-members.repository';
import type { CreateWorkspaceInvitationDto } from './dto/create-workspace-invitation.dto';
import { WorkspaceInvitationsRepository } from './workspace-invitations.repository';
import type {
  AcceptedInvitationResponse,
  InvitationPreviewResponse,
  WorkspaceInvitationResponse,
} from './workspace-invitations.types';
import { Logger, ServiceUnavailableException } from '@nestjs/common';

import { InvitationEmailQueueService } from '../../infrastructure/queue/invitation-email-queue.service';
@Injectable()
export class WorkspaceInvitationsService {
  private readonly logger = new Logger(WorkspaceInvitationsService.name);
  public constructor(
    private readonly invitationsRepository: WorkspaceInvitationsRepository,

    private readonly membersRepository: WorkspaceMembersRepository,

    private readonly invitationEmailQueue: InvitationEmailQueueService,

    private readonly configService: ConfigService,
  ) {}

  public async create(
    context: WorkspaceMembershipContext,
    inviter: AccessTokenPayload,
    dto: CreateWorkspaceInvitationDto,
  ): Promise<WorkspaceInvitationResponse> {
    this.assertCanInvite(context.membership.role, dto.role);

    const email = this.normalizeEmail(dto.email);

    if (email === this.normalizeEmail(inviter.email)) {
      throw new ConflictException('You are already a member of this workspace');
    }

    const existingUserMember = await this.findMemberByEmail(
      context.workspace.id,
      email,
    );

    if (existingUserMember) {
      throw new ConflictException('This user is already a workspace member');
    }

    const existingInvitation =
      await this.invitationsRepository.findPendingByEmail(
        context.workspace.id,
        email,
      );

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email',
      );
    }

    const rawToken = this.generateToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = this.calculateExpiration();

    try {
      const invitation = await this.invitationsRepository.create({
        workspaceId: context.workspace.id,
        email,
        role: dto.role,
        tokenHash,
        invitedByUserId: context.membership.userId,
        expiresAt,
      });

      const inviterName = await this.getInviterDisplayName(
        context.membership.userId,
        inviter.email,
      );

      try {
        await this.enqueueInvitationEmail({
          invitationId: invitation.id,
          workspaceId: invitation.workspaceId,
          email,
          inviterName,
          workspaceName: context.workspace.name,
          role: dto.role,
          rawToken,
          expiresAt,
        });
      } catch (error: unknown) {
        const removed =
          await this.invitationsRepository.deletePendingByTokenHash(
            invitation.id,
            tokenHash,
          );

        this.logger.error(
          `Failed to enqueue invitation email ${invitation.id}; ` +
            `compensation removed=${removed}`,
          error instanceof Error ? error.stack : String(error),
        );

        throw new ServiceUnavailableException(
          'Invitation email service is temporarily unavailable',
        );
      }

      const invitations = await this.invitationsRepository.findAllForWorkspace(
        context.workspace.id,
      );

      const response = invitations.find((item) => item.id === invitation.id);

      if (!response) {
        throw new Error('Created invitation could not be loaded');
      }

      return response;
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException(
          'A pending invitation already exists for this email',
        );
      }

      throw error;
    }
  }

  public async findAll(
    context: WorkspaceMembershipContext,
  ): Promise<WorkspaceInvitationResponse[]> {
    this.assertManager(context.membership.role);

    return this.invitationsRepository.findAllForWorkspace(context.workspace.id);
  }

  public async preview(rawToken: string): Promise<InvitationPreviewResponse> {
    const row = await this.findByRawToken(rawToken);

    return {
      workspace: row.workspace,
      inviter: row.inviter,
      recipientEmail: row.invitation.email,
      role: row.invitation.role,
      status:
        row.invitation.status === 'pending' &&
        row.invitation.expiresAt <= new Date()
          ? 'expired'
          : row.invitation.status,
      expiresAt: row.invitation.expiresAt,
    };
  }

  public async accept(
    rawToken: string,
    user: AccessTokenPayload,
  ): Promise<AcceptedInvitationResponse> {
    const row = await this.findByRawToken(rawToken);

    this.assertInvitationUsable(
      row.invitation.status,
      row.invitation.expiresAt,
    );

    if (
      this.normalizeEmail(row.invitation.email) !==
      this.normalizeEmail(user.email)
    ) {
      throw new ForbiddenException(
        'Sign in with the email address that received this invitation',
      );
    }

    const existingMembership = await this.membersRepository.findByUserId(
      row.invitation.workspaceId,
      user.sub,
    );

    if (existingMembership) {
      throw new ConflictException('You are already a member of this workspace');
    }

    try {
      return await this.invitationsRepository.accept(
        row.invitation.id,
        user.sub,
        row.invitation.role,
        row.invitation.workspaceId,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'INVITATION_NOT_ACCEPTABLE'
      ) {
        throw new GoneException('This invitation is no longer available');
      }

      if (
        error instanceof Error &&
        error.message === 'MEMBERSHIP_ALREADY_EXISTS'
      ) {
        throw new ConflictException(
          'You are already a member of this workspace',
        );
      }

      throw error;
    }
  }

  public async decline(
    rawToken: string,
    user: AccessTokenPayload,
  ): Promise<void> {
    const row = await this.findByRawToken(rawToken);

    this.assertInvitationUsable(
      row.invitation.status,
      row.invitation.expiresAt,
    );

    if (
      this.normalizeEmail(row.invitation.email) !==
      this.normalizeEmail(user.email)
    ) {
      throw new ForbiddenException(
        'Sign in with the email address that received this invitation',
      );
    }

    const declined = await this.invitationsRepository.decline(
      row.invitation.id,
    );

    if (!declined) {
      throw new GoneException('This invitation is no longer available');
    }
  }

  public async resend(
    context: WorkspaceMembershipContext,
    invitationId: string,
  ): Promise<void> {
    this.assertManager(context.membership.role);

    const invitation = await this.invitationsRepository.findById(
      context.workspace.id,
      invitationId,
    );

    if (!invitation) {
      throw new NotFoundException('Invitation was not found');
    }

    if (invitation.status !== 'pending') {
      throw new ConflictException('Only pending invitations can be resent');
    }

    const rawToken = this.generateToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = this.calculateExpiration();

    const updatedInvitation = await this.invitationsRepository.replaceToken(
      invitation.id,
      tokenHash,
      expiresAt,
    );

    if (!updatedInvitation) {
      throw new ConflictException('This invitation is no longer pending');
    }

    const inviterName = await this.getInviterDisplayName(
      context.membership.userId,
      'TaskFlow user',
    );
    const previousTokenHash = invitation.tokenHash;
    const previousExpiresAt = invitation.expiresAt;
    const previousLastSentAt = invitation.lastSentAt;
    try {
      await this.enqueueInvitationEmail({
        invitationId: updatedInvitation.id,
        workspaceId: updatedInvitation.workspaceId,
        email: updatedInvitation.email,
        inviterName,
        workspaceName: context.workspace.name,
        role: updatedInvitation.role === 'admin' ? 'admin' : 'member',
        rawToken,
        expiresAt,
      });
    } catch (error: unknown) {
      const restored =
        await this.invitationsRepository.restoreTokenAfterQueueFailure(
          updatedInvitation.id,
          tokenHash,
          previousTokenHash,
          previousExpiresAt,
          previousLastSentAt,
        );

      this.logger.error(
        `Failed to enqueue resent invitation ${updatedInvitation.id}; ` +
          `compensation restored=${restored}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new ServiceUnavailableException(
        'Invitation email service is temporarily unavailable',
      );
    }
  }

  public async cancel(
    context: WorkspaceMembershipContext,
    invitationId: string,
  ): Promise<void> {
    this.assertManager(context.membership.role);

    const invitation = await this.invitationsRepository.findById(
      context.workspace.id,
      invitationId,
    );

    if (!invitation) {
      throw new NotFoundException('Invitation was not found');
    }

    const cancelled = await this.invitationsRepository.cancel(invitation.id);

    if (!cancelled) {
      throw new ConflictException('Only pending invitations can be cancelled');
    }
  }

  private assertCanInvite(
    inviterRole: 'owner' | 'admin' | 'member',
    invitedRole: 'admin' | 'member',
  ): void {
    if (inviterRole === 'member') {
      throw new ForbiddenException('Members cannot invite workspace members');
    }

    /*
     * Admins may invite ordinary members but cannot
     * create another administrator.
     */
    if (inviterRole === 'admin' && invitedRole === 'admin') {
      throw new ForbiddenException(
        'Only the workspace owner can invite administrators',
      );
    }
  }

  private assertManager(role: 'owner' | 'admin' | 'member'): void {
    if (role !== 'owner' && role !== 'admin') {
      throw new ForbiddenException(
        'You do not have permission to manage invitations',
      );
    }
  }

  private assertInvitationUsable(
    status: 'pending' | 'accepted' | 'declined' | 'cancelled',
    expiresAt: Date,
  ): void {
    if (status !== 'pending') {
      throw new GoneException('This invitation is no longer available');
    }

    if (expiresAt <= new Date()) {
      throw new GoneException('This invitation has expired');
    }
  }

  private async findByRawToken(rawToken: string) {
    if (!/^[A-Za-z0-9_-]{40,200}$/.test(rawToken)) {
      throw new NotFoundException('Invitation was not found');
    }

    const tokenHash = this.hashToken(rawToken);

    const row =
      await this.invitationsRepository.findPreviewByTokenHash(tokenHash);

    if (!row) {
      throw new NotFoundException('Invitation was not found');
    }

    return row;
  }

  private generateToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private calculateExpiration(): Date {
    const ttlHours =
      this.configService.get<number>('WORKSPACE_INVITATION_TTL_HOURS') ?? 168;

    return new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  }

  // private async sendInvitationEmail(input: {
  //   email: string;
  //   inviterName: string;
  //   workspaceName: string;
  //   role: 'admin' | 'member';
  //   rawToken: string;
  //   expiresAt: Date;
  // }): Promise<void> {
  //   const frontendUrl = this.configService
  //     .getOrThrow<string>('FRONTEND_URL')
  //     .replace(/\/+$/, '');

  //   const invitationUrl =
  //     `${frontendUrl}/invitations/` + encodeURIComponent(input.rawToken);

  //   await this.mailService.sendWorkspaceInvitation({
  //     recipientEmail: input.email,
  //     inviterName: input.inviterName,
  //     workspaceName: input.workspaceName,
  //     role: input.role,
  //     invitationUrl,
  //     expiresAt: input.expiresAt,
  //   });
  // }

  private async findMemberByEmail(
    workspaceId: string,
    email: string,
  ): Promise<boolean> {
    /*
     * Add the repository method shown immediately
     * below. It performs the membership/email join.
     */
    return this.membersRepository.existsByEmail(workspaceId, email);
  }

  private async getInviterDisplayName(
    userId: string,
    fallback: string,
  ): Promise<string> {
    const member = await this.membersRepository.findResponseByUserId(userId);

    if (!member) {
      return fallback;
    }

    return `${member.user.firstName} ${member.user.lastName}`.trim();
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    );
  }
  private async enqueueInvitationEmail(input: {
    invitationId: string;
    workspaceId: string;
    email: string;
    inviterName: string;
    workspaceName: string;
    role: 'admin' | 'member';
    rawToken: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.invitationEmailQueue.enqueue({
      invitationId: input.invitationId,
      workspaceId: input.workspaceId,
      recipientEmail: input.email,
      inviterName: input.inviterName,
      workspaceName: input.workspaceName,
      role: input.role,
      rawToken: input.rawToken,
      expiresAt: input.expiresAt.toISOString(),
    });
  }
}
