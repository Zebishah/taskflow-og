import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { TaskReminderRepository } from './task-reminder.repository';

/**
 * In-memory gate so the reminder cron skips Postgres when nothing
 * is scheduled. Syncs once on boot after Render cold starts.
 */
@Injectable()
export class TaskReminderPendingTracker implements OnModuleInit {
  private readonly logger = new Logger(TaskReminderPendingTracker.name);

  private pendingCount = 0;

  private nextDueAtMs: number | null = null;

  public constructor(private readonly repository: TaskReminderRepository) {}

  public async onModuleInit(): Promise<void> {
    await this.syncFromDatabase();
  }

  public shouldDispatch(now = Date.now()): boolean {
    if (this.pendingCount <= 0) {
      return false;
    }

    if (this.nextDueAtMs !== null && this.nextDueAtMs > now) {
      return false;
    }

    return true;
  }

  public onReminderScheduled(reminderAt: Date): void {
    this.pendingCount += 1;
    const reminderMs = reminderAt.getTime();
    this.nextDueAtMs =
      this.nextDueAtMs === null
        ? reminderMs
        : Math.min(this.nextDueAtMs, reminderMs);
  }

  public onReminderRescheduled(reminderAt: Date): void {
    const reminderMs = reminderAt.getTime();
    this.nextDueAtMs =
      this.nextDueAtMs === null
        ? reminderMs
        : Math.min(this.nextDueAtMs, reminderMs);
  }

  public onReminderCleared(): void {
    this.pendingCount = Math.max(0, this.pendingCount - 1);

    if (this.pendingCount === 0) {
      this.nextDueAtMs = null;
    } else {
      /*
       * Earliest due time may have changed; next dispatch resyncs if needed.
       */
      this.nextDueAtMs = null;
    }
  }

  public onRemindersClaimed(count: number): void {
    this.pendingCount = Math.max(0, this.pendingCount - count);

    if (this.pendingCount === 0) {
      this.nextDueAtMs = null;
    } else {
      this.nextDueAtMs = null;
    }
  }

  public onReminderClaimReleased(): void {
    this.pendingCount += 1;
  }

  public async syncFromDatabase(): Promise<void> {
    const snapshot = await this.repository.countPendingReminders();

    this.pendingCount = snapshot.count;
    this.nextDueAtMs = snapshot.earliestDueAt?.getTime() ?? null;

    this.logger.log(
      JSON.stringify({
        event: 'task-reminder.pending-sync',
        pendingCount: this.pendingCount,
        nextDueAt: snapshot.earliestDueAt?.toISOString() ?? null,
      }),
    );
  }
}
