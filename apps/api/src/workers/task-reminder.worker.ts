import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker } from 'bullmq';

import { TASK_REMINDER_QUEUE_NAME } from '../infrastructure/queue/queue.constants';
import type {
  TaskReminderJobData,
  TaskReminderJobName,
} from '../infrastructure/queue/queue.types';
import { createRedisConnectionOptions } from '../infrastructure/queue/redis-connection';
import { TaskReminderProcessor } from './task-reminder.processor';

@Injectable()
export class TaskReminderWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TaskReminderWorker.name);

  private worker: Worker<
    TaskReminderJobData,
    void,
    TaskReminderJobName
  > | null = null;

  public constructor(
    private readonly configService: ConfigService,
    private readonly processor: TaskReminderProcessor,
  ) {}

  public onModuleInit(): void {
    const redisUrl = this.configService.getOrThrow<string>('REDIS_URL');

    const concurrency = this.configService.getOrThrow<number>(
      'QUEUE_TASK_REMINDER_CONCURRENCY',
    );

    this.worker = new Worker<TaskReminderJobData, void, TaskReminderJobName>(
      TASK_REMINDER_QUEUE_NAME,

      async (job) => {
        await this.processor.process(job);
      },

      {
        connection: createRedisConnectionOptions(redisUrl, true),

        concurrency,
      },
    );

    this.worker.on('ready', () => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.worker.ready',
          queue: TASK_REMINDER_QUEUE_NAME,
          concurrency,
        }),
      );
    });

    this.worker.on('active', (job) => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.job.active',
          queue: TASK_REMINDER_QUEUE_NAME,
          jobId: job.id,
          taskId: job.data.taskId,
          attempt: job.attemptsMade + 1,
        }),
      );
    });

    this.worker.on('completed', (job) => {
      this.logger.log(
        JSON.stringify({
          event: 'queue.job.completed',
          queue: TASK_REMINDER_QUEUE_NAME,
          jobId: job.id,
          taskId: job.data.taskId,
        }),
      );
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        JSON.stringify({
          event: 'queue.job.failed',
          queue: TASK_REMINDER_QUEUE_NAME,
          jobId: job?.id ?? null,
          taskId: job?.data.taskId ?? null,
          attemptsMade: job?.attemptsMade ?? null,
          error: error.message,
        }),
        error.stack,
      );
    });

    this.worker.on('error', (error) => {
      this.logger.error(
        JSON.stringify({
          event: 'queue.worker.error',
          queue: TASK_REMINDER_QUEUE_NAME,
          error: error.message,
        }),
        error.stack,
      );
    });
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
