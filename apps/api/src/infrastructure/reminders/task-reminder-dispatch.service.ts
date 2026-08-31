import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

import type { Task } from '../../database/schema';
import { MailService } from '../mail/mail.service';
import { TaskReminderPendingTracker } from './task-reminder-pending.tracker';
import { TaskReminderRepository } from './task-reminder.repository';

@Injectable()
export class TaskReminderDispatchService {
  private readonly logger = new Logger(TaskReminderDispatchService.name);

  private isRunning = false;

  public constructor(
    private readonly repository: TaskReminderRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly pendingTracker: TaskReminderPendingTracker,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  public async processDueReminders(): Promise<void> {
    if (!this.pendingTracker.shouldDispatch()) {
      return;
    }

    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const claimed = await this.repository.claimDueReminders(50);

      if (claimed.length === 0) {
        await this.pendingTracker.syncFromDatabase();

        return;
      }

      this.pendingTracker.onRemindersClaimed(claimed.length);

      for (const task of claimed) {
        await this.dispatch(task);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

      this.logger.error('Failed while processing due task reminders', message);
    } finally {
      this.isRunning = false;
    }
  }

  private async dispatch(task: Task): Promise<void> {
    try {
      const context = await this.repository.findContext(
        task.workspaceId,
        task.projectId,
        task.id,
      );

      if (!context) {
        this.logger.warn(`Skipping missing task ${task.id}`);

        return;
      }

      if (context.columnKind === 'done' || context.completedAt !== null) {
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

      if (context.assigneeMemberId !== task.assigneeMemberId) {
        this.logger.warn(`Skipping stale assignee reminder ${task.id}`);

        return;
      }

      if (
        task.dueAt === null ||
        context.dueAt.getTime() !== task.dueAt.getTime()
      ) {
        this.logger.warn(`Skipping stale due-date reminder ${task.id}`);

        return;
      }

      if (context.dueAt.getTime() <= Date.now()) {
        this.logger.warn(`Skipping already overdue task ${context.taskId}`);

        return;
      }

      if (context.recipientStatus !== 'active') {
        this.logger.warn(
          `Skipping inactive assignee for task ${context.taskId}`,
        );

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

      const idempotencyKey =
        `task-due-reminder/` +
        `${context.taskId}/` +
        `${context.assigneeMemberId}/` +
        `${context.dueAt.getTime()}`;

      await this.mailService.sendTaskDueReminder({
        recipientEmail: context.recipientEmail,
        recipientFirstName: context.recipientFirstName,
        workspaceName: context.workspaceName,
        projectName: context.projectName,
        taskIdentifier: `${context.projectKey}-` + context.taskNumber,
        taskTitle: context.title,
        taskUrl,
        dueAt: context.dueAt,
        idempotencyKey,
      });

      this.logger.log(
        JSON.stringify({
          event: 'task-reminder.accepted-by-provider',
          taskId: context.taskId,
        }),
      );
    } catch (error: unknown) {
      await this.repository.releaseClaim(task.id);
      this.pendingTracker.onReminderClaimReleased();

      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

      this.logger.error(
        `Failed to send reminder for task ${task.id}; claim released for retry`,
        message,
      );
    }
  }
}
