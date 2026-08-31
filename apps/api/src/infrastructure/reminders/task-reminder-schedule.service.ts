import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Task } from '../../database/schema';
import { TaskReminderPendingTracker } from './task-reminder-pending.tracker';
import { TaskReminderRepository } from './task-reminder.repository';

/**
 * Replaces BullMQ delayed jobs by storing reminder_at on the task row.
 * A cron dispatcher later sends emails when reminder_at is due.
 */
@Injectable()
export class TaskReminderScheduleService {
  private readonly logger = new Logger(TaskReminderScheduleService.name);

  public constructor(
    private readonly repository: TaskReminderRepository,
    private readonly configService: ConfigService,
    private readonly pendingTracker: TaskReminderPendingTracker,
  ) {}

  public async reconcile(
    previousTask: Task | null,
    currentTask: Task | null,
  ): Promise<void> {
    if (previousTask && (!currentTask || previousTask.id !== currentTask.id)) {
      await this.cancel(previousTask);
    }

    if (currentTask) {
      await this.schedule(currentTask);
    }
  }

  public async schedule(task: Task): Promise<void> {
    if (!this.isSchedulable(task)) {
      if (this.hasPendingReminder(task)) {
        await this.repository.clearReminder(task.id);
        this.pendingTracker.onReminderCleared();
      }

      this.logger.log(
        JSON.stringify({
          event: 'task-reminder.cleared',
          taskId: task.id,
        }),
      );

      return;
    }

    const dueAt = task.dueAt;

    if (!dueAt || !task.assigneeMemberId) {
      if (this.hasPendingReminder(task)) {
        await this.repository.clearReminder(task.id);
        this.pendingTracker.onReminderCleared();
      }

      return;
    }

    const leadMinutes = this.configService.getOrThrow<number>(
      'TASK_REMINDER_LEAD_MINUTES',
    );

    const reminderTimeMs = dueAt.getTime() - leadMinutes * 60_000;
    /*
     * If the lead window already passed but the task is still
     * due in the future, fire on the next cron tick.
     */
    const reminderAt = new Date(
      reminderTimeMs < Date.now() ? Date.now() : reminderTimeMs,
    );

    await this.repository.updateReminderSchedule(task.id, reminderAt, true);

    if (this.hasPendingReminder(task)) {
      this.pendingTracker.onReminderRescheduled(reminderAt);
    } else {
      this.pendingTracker.onReminderScheduled(reminderAt);
    }

    this.logger.log(
      JSON.stringify({
        event: 'task-reminder.scheduled',
        taskId: task.id,
        dueAt: dueAt.toISOString(),
        reminderAt: reminderAt.toISOString(),
      }),
    );
  }

  public async cancel(task: Task): Promise<void> {
    if (this.hasPendingReminder(task)) {
      await this.repository.clearReminder(task.id);
      this.pendingTracker.onReminderCleared();
    }

    this.logger.log(
      JSON.stringify({
        event: 'task-reminder.cancelled',
        taskId: task.id,
      }),
    );
  }

  private hasPendingReminder(task: Task): boolean {
    return task.reminderAt !== null && task.reminderSentAt === null;
  }

  private isSchedulable(task: Task): boolean {
    return (
      task.completedAt === null &&
      task.assigneeMemberId !== null &&
      task.dueAt !== null &&
      task.dueAt.getTime() > Date.now()
    );
  }
}
