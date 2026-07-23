import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';

import { MailService } from '../infrastructure/mail/mail.service';
import { SEND_INVITATION_EMAIL_JOB } from '../infrastructure/queue/queue.constants';
import type { InvitationEmailJob } from '../infrastructure/queue/queue.types';
import { WorkspaceInvitationsRepository } from '../modules/workspace-invitations/workspace-invitations.repository';

@Injectable()
export class InvitationEmailProcessor {
  private readonly logger = new Logger(InvitationEmailProcessor.name);

  public constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly invitationsRepository: WorkspaceInvitationsRepository,
  ) {}

  public async process(job: InvitationEmailJob): Promise<void> {
    if (job.name !== SEND_INVITATION_EMAIL_JOB) {
      throw new Error(`Unsupported job name: ${String(job.name)}`);
    }

    this.logger.log(
      JSON.stringify({
        event: 'invitation-email.processing',
        jobId: job.id,
        invitationId: job.data.invitationId,
        workspaceId: job.data.workspaceId,
      }),
    );

    const invitation = await this.invitationsRepository.findById(
      job.data.workspaceId,
      job.data.invitationId,
    );

    if (!invitation) {
      this.logger.warn(`Skipping deleted invitation ${job.data.invitationId}`);

      return;
    }

    if (invitation.status !== 'pending') {
      this.logger.warn(`Skipping non-pending invitation ${invitation.id}`);

      return;
    }

    if (invitation.expiresAt <= new Date()) {
      this.logger.warn(`Skipping expired invitation ${invitation.id}`);

      return;
    }

    const queuedTokenHash = createHash('sha256')
      .update(job.data.rawToken)
      .digest('hex');

    if (queuedTokenHash !== invitation.tokenHash) {
      this.logger.warn(`Skipping stale invitation job ${job.id}`);

      return;
    }

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');

    const invitationUrl =
      `${frontendUrl}/invitations/` + encodeURIComponent(job.data.rawToken);

    await this.mailService.sendWorkspaceInvitation({
      recipientEmail: job.data.recipientEmail,
      inviterName: job.data.inviterName,
      workspaceName: job.data.workspaceName,
      role: job.data.role,
      invitationUrl,
      expiresAt: new Date(job.data.expiresAt),
      idempotencyKey: `workspace-invitation/${job.id}`,
    });

    this.logger.log(
      JSON.stringify({
        event: 'invitation-email.accepted-by-provider',
        jobId: job.id,
        invitationId: job.data.invitationId,
      }),
    );
  }
}
