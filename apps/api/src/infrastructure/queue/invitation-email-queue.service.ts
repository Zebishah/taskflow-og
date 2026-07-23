import { Inject, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Queue } from 'bullmq';

import {
  INVITATION_EMAIL_QUEUE,
  INVITATION_EMAIL_QUEUE_NAME,
  SEND_INVITATION_EMAIL_JOB,
} from './queue.constants';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from './queue.types';

@Injectable()
export class InvitationEmailQueueService {
  private readonly logger = new Logger(InvitationEmailQueueService.name);

  public constructor(
    @Inject(INVITATION_EMAIL_QUEUE)
    private readonly queue: Queue<
      InvitationEmailJobData,
      void,
      InvitationEmailJobName
    >,
  ) {}

  public async enqueue(data: InvitationEmailJobData): Promise<void> {
    const tokenFingerprint = createHash('sha256')
      .update(data.rawToken)
      .digest('hex')
      .slice(0, 16);

    const jobId = `invitation-email-${data.invitationId}-` + tokenFingerprint;

    const job = await this.queue.add(SEND_INVITATION_EMAIL_JOB, data, {
      jobId,
      attempts: 5,

      backoff: {
        type: 'exponential',
        delay: 5_000,
      },

      removeOnComplete: {
        age: 24 * 60 * 60,
        count: 1_000,
      },

      removeOnFail: {
        age: 7 * 24 * 60 * 60,
        count: 5_000,
      },
    });

    this.logger.log(
      JSON.stringify({
        event: 'queue.job.enqueued',
        queue: INVITATION_EMAIL_QUEUE_NAME,
        jobName: job.name,
        jobId: job.id,
        invitationId: data.invitationId,
        workspaceId: data.workspaceId,
      }),
    );
  }
}
