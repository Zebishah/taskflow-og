/*
 * ============================================================================
 * DISABLED — BullMQ queue module is preserved for later restore only.
 * Do NOT import QueueModule into AppModule / feature modules.
 * Active path: immediate emails + Postgres/cron reminders + Upstash cache.
 * ============================================================================
 */
import {
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import { InvitationEmailQueueService } from './invitation-email-queue.service';
import {
  INVITATION_EMAIL_QUEUE,
  INVITATION_EMAIL_QUEUE_NAME,
  TASK_REMINDER_QUEUE,
  TASK_REMINDER_QUEUE_NAME,
} from './queue.constants';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
  TaskReminderJobData,
  TaskReminderJobName,
} from './queue.types';
import { createRedisConnectionOptions } from './redis-connection';
import { TaskReminderQueueService } from './task-reminder-queue.service';

@Injectable()
class QueueLifecycleService implements OnApplicationShutdown {
  public constructor(
    @Inject(INVITATION_EMAIL_QUEUE)
    private readonly invitationQueue: Queue<
      InvitationEmailJobData,
      void,
      InvitationEmailJobName
    >,

    @Inject(TASK_REMINDER_QUEUE)
    private readonly taskReminderQueue: Queue<
      TaskReminderJobData,
      void,
      TaskReminderJobName
    >,
  ) {}

  public async onApplicationShutdown(): Promise<void> {
    await Promise.all([
      this.invitationQueue.close(),
      this.taskReminderQueue.close(),
    ]);
  }
}

@Module({
  providers: [
    {
      provide: INVITATION_EMAIL_QUEUE,
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): Queue<InvitationEmailJobData, void, InvitationEmailJobName> => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Queue<InvitationEmailJobData, void, InvitationEmailJobName>(
          INVITATION_EMAIL_QUEUE_NAME,
          {
            connection: createRedisConnectionOptions(redisUrl, false),
          },
        );
      },
    },

    {
      provide: TASK_REMINDER_QUEUE,
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): Queue<TaskReminderJobData, void, TaskReminderJobName> => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Queue<TaskReminderJobData, void, TaskReminderJobName>(
          TASK_REMINDER_QUEUE_NAME,
          {
            connection: createRedisConnectionOptions(redisUrl, false),
          },
        );
      },
    },

    InvitationEmailQueueService,
    TaskReminderQueueService,
    QueueLifecycleService,
  ],

  exports: [
    INVITATION_EMAIL_QUEUE,
    TASK_REMINDER_QUEUE,
    InvitationEmailQueueService,
    TaskReminderQueueService,
  ],
})
export class QueueModule {}
