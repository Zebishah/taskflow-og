import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';

import type { Task } from '../../database/schema';
import {
  SEND_TASK_DUE_REMINDER_JOB,
  TASK_REMINDER_QUEUE,
  TASK_REMINDER_QUEUE_NAME,
} from './queue.constants';
import type { TaskReminderJobData, TaskReminderJobName } from './queue.types';

@Injectable()
export class TaskReminderQueueService {
  private readonly logger = new Logger(TaskReminderQueueService.name);

  public constructor(
    @Inject(TASK_REMINDER_QUEUE)
    private readonly queue: Queue<
      TaskReminderJobData,
      void,
      TaskReminderJobName
    >,

    private readonly configService: ConfigService,
  ) {}

  public async reconcile(
    previousTask: Task | null,
    currentTask: Task | null,
  ): Promise<void> {
    if (previousTask) {
      await this.cancel(previousTask);
    }

    if (currentTask) {
      await this.schedule(currentTask);
    }
  }

  public async schedule(
    task: Task,
  ): Promise<Job<TaskReminderJobData, void, TaskReminderJobName> | null> {
    if (!this.isSchedulable(task)) {
      return null;
    }

    const dueAt = task.dueAt;

    if (!dueAt || !task.assigneeMemberId) {
      return null;
    }

    const leadMinutes = this.configService.getOrThrow<number>(
      'TASK_REMINDER_LEAD_MINUTES',
    );

    const reminderTime = dueAt.getTime() - leadMinutes * 60_000;

    const delay = Math.max(0, reminderTime - Date.now());

    const data: TaskReminderJobData = {
      taskId: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      assigneeMemberId: task.assigneeMemberId,
      dueAt: dueAt.toISOString(),
    };

    const jobId = this.getJobId(task);

    const job = await this.queue.add(SEND_TASK_DUE_REMINDER_JOB, data, {
      jobId,
      delay,
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
        event: 'task-reminder.scheduled',
        queue: TASK_REMINDER_QUEUE_NAME,
        jobId: job.id,
        taskId: task.id,
        dueAt: dueAt.toISOString(),
        delay,
      }),
    );

    return job;
  }

  public async cancel(task: Task): Promise<void> {
    if (!task.dueAt || !task.assigneeMemberId) {
      return;
    }

    const jobId = this.getJobId(task);
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return;
    }

    const state = await job.getState();

    /*
     * BullMQ does not allow an active job to be removed.
     * The processor will check the latest database state
     * and safely skip an active stale job.
     */
    if (state === 'active') {
      this.logger.warn(
        JSON.stringify({
          event: 'task-reminder.cancel-skipped-active',
          jobId,
          taskId: task.id,
        }),
      );

      return;
    }

    await job.remove();

    this.logger.log(
      JSON.stringify({
        event: 'task-reminder.cancelled',
        jobId,
        taskId: task.id,
      }),
    );
  }

  private isSchedulable(task: Task): boolean {
    return (
      task.completedAt === null &&
      task.assigneeMemberId !== null &&
      task.dueAt !== null &&
      task.dueAt.getTime() > Date.now()
    );
  }

  private getJobId(task: Task): string {
    if (!task.dueAt || !task.assigneeMemberId) {
      throw new Error('A reminder job requires a due date and assignee');
    }

    return [
      'task-reminder',
      task.id,
      task.assigneeMemberId,
      task.dueAt.getTime(),
    ].join('-');
  }
}
