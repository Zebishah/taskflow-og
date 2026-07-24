import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MailService } from '../infrastructure/mail/mail.service';
import { SEND_TASK_DUE_REMINDER_JOB } from '../infrastructure/queue/queue.constants';
import type { TaskReminderJob } from '../infrastructure/queue/queue.types';
import { TaskReminderRepository } from './task-reminder.repository';

@Injectable()
export class TaskReminderProcessor {
  private readonly logger = new Logger(TaskReminderProcessor.name);

  public constructor(
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly repository: TaskReminderRepository,
  ) {}

  public async process(job: TaskReminderJob): Promise<void> {
    if (job.name !== SEND_TASK_DUE_REMINDER_JOB) {
      throw new Error(`Unsupported job name: ${String(job.name)}`);
    }

    const context = await this.repository.findContext(
      job.data.workspaceId,
      job.data.projectId,
      job.data.taskId,
    );

    if (!context) {
      this.logger.warn(`Skipping missing task ${job.data.taskId}`);

      return;
    }

    if (context.status === 'done') {
      this.logger.warn(`Skipping completed task ${context.taskId}`);

      return;
    }

    if (context.projectArchivedAt) {
      this.logger.warn(`Skipping task in archived project ${context.taskId}`);

      return;
    }

    if (!context.dueAt) {
      this.logger.warn(`Skipping task without due date ${context.taskId}`);

      return;
    }

    if (context.assigneeMemberId !== job.data.assigneeMemberId) {
      this.logger.warn(`Skipping stale assignee job ${job.id}`);

      return;
    }

    if (context.dueAt.toISOString() !== job.data.dueAt) {
      this.logger.warn(`Skipping stale due-date job ${job.id}`);

      return;
    }

    if (context.dueAt.getTime() <= Date.now()) {
      this.logger.warn(`Skipping already overdue task ${context.taskId}`);

      return;
    }

    if (context.recipientStatus !== 'active') {
      this.logger.warn(`Skipping inactive assignee for task ${context.taskId}`);

      return;
    }

    const frontendUrl = this.configService
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/+$/, '');

    const taskUrl =
      `${frontendUrl}/workspaces/` +
      `${encodeURIComponent(context.workspaceId)}` +
      `/projects/` +
      encodeURIComponent(context.projectId);

    await this.mailService.sendTaskDueReminder({
      recipientEmail: context.recipientEmail,
      recipientFirstName: context.recipientFirstName,
      workspaceName: context.workspaceName,
      projectName: context.projectName,
      taskIdentifier: `${context.projectKey}-` + context.taskNumber,
      taskTitle: context.title,
      taskUrl,
      dueAt: context.dueAt,
      idempotencyKey: `task-due-reminder/${job.id}`,
    });

    this.logger.log(
      JSON.stringify({
        event: 'task-reminder.accepted-by-provider',
        jobId: job.id,
        taskId: context.taskId,
      }),
    );
  }
}
