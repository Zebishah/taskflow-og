import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { Job, Worker } from 'bullmq';

import { MailService } from '../infrastructure/mail/mail.service';
import {
  INVITATION_EMAIL_QUEUE_NAME,
  SEND_INVITATION_EMAIL_JOB,
} from '../infrastructure/queue/queue.constants';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from '../infrastructure/queue/queue.types';
import { createRedisConnectionOptions } from '../infrastructure/queue/redis-connection';
import { WorkspaceInvitationsRepository } from '../modules/workspace-invitations/workspace-invitations.repository';

@Injectable()
export class InvitationEmailWorker
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(InvitationEmailWorker.name);

  private worker: Worker<
    InvitationEmailJobData,
    void,
    InvitationEmailJobName
  > | null = null;

  public constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly invitationsRepository: WorkspaceInvitationsRepository,
  ) {}

  public onModuleInit(): void {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

    const concurrency = this.configService.getOrThrow<number>(
      'QUEUE_INVITATION_EMAIL_CONCURRENCY',
    );

    this.worker = new Worker<
      InvitationEmailJobData,
      void,
      InvitationEmailJobName
    >(INVITATION_EMAIL_QUEUE_NAME, async (job) => this.process(job), {
      connection: createRedisConnectionOptions(redisUrl, true),
      concurrency,
    });

    this.worker.on('ready', () => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.worker.ready',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          concurrency,
        }),
      );
    });

    this.worker.on('active', (job) => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.job.active',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          jobId: job.id,
          jobName: job.name,
          attempt: job.attemptsMade + 1,
          maximumAttempts: job.opts.attempts ?? 1,
          invitationId: job.data.invitationId,
        }),
      );
    });

    this.worker.on('completed', (job) => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.job.completed',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          jobId: job.id,
          invitationId: job.data.invitationId,
          attemptsMade: job.attemptsMade,
        }),
      );
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        JSON.stringify({
          event: 'queue.job.failed',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          jobId: job?.id ?? null,
          invitationId: job?.data.invitationId ?? null,
          attemptsMade: job?.attemptsMade ?? null,
          maximumAttempts: job?.opts.attempts ?? null,
          error: error.message,
        }),
        error.stack,
      );
    });

    this.worker.on('stalled', (jobId) => {
      this.logger.warn(
        JSON.stringify({
          event: 'queue.job.stalled',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          jobId,
        }),
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error(
        JSON.stringify({
          event: 'queue.worker.error',
          queue: INVITATION_EMAIL_QUEUE_NAME,
          error: error.message,
        }),
        error.stack,
      );
    });

    this.logger.log(
      JSON.stringify({
        event: 'queue.worker.started',
        queue: INVITATION_EMAIL_QUEUE_NAME,
        concurrency,
      }),
    );
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }

  private async process(
    job: Job<InvitationEmailJobData, void, InvitationEmailJobName>,
  ): Promise<void> {
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

    /*
     * A resend creates a new token. This check prevents
     * an older delayed/retried job from emailing a stale link.
     */
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

      /*
       * The same BullMQ job retries with the same key,
       * preventing duplicate Resend delivery.
       */
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
