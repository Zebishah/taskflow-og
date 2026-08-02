import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, gt, isNotNull, isNull, lte } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  projectColumns,
  projects,
  tasks,
  users,
  workspaceMembers,
  workspaces,
  type Task,
} from '../../database/schema';

export interface TaskReminderContext {
  taskId: string;
  workspaceId: string;
  projectId: string;
  title: string;
  taskNumber: number;
  columnId: string;
  columnKind: 'backlog' | 'active' | 'done';
  completedAt: Date | null;
  dueAt: Date | null;
  assigneeMemberId: string | null;
  projectName: string;
  projectKey: string;
  projectArchivedAt: Date | null;
  workspaceName: string;
  recipientEmail: string;
  recipientFirstName: string;
  recipientStatus: 'active' | 'disabled';
}

@Injectable()
export class TaskReminderRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async updateReminderSchedule(
    taskId: string,
    reminderAt: Date | null,
    clearSentAt: boolean,
  ): Promise<void> {
    await this.database
      .update(tasks)
      .set({
        reminderAt,
        ...(clearSentAt ? { reminderSentAt: null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));
  }

  public async clearReminder(taskId: string): Promise<void> {
    await this.database
      .update(tasks)
      .set({
        reminderAt: null,
        reminderSentAt: null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId));
  }

  /**
   * Atomically claims due reminder rows so concurrent API instances
   * do not send the same reminder twice.
   */
  public async claimDueReminders(limit: number): Promise<Task[]> {
    const now = new Date();

    return this.database.transaction(async (transaction) => {
      const candidates = await transaction
        .select({
          id: tasks.id,
        })
        .from(tasks)
        .where(
          and(
            isNotNull(tasks.reminderAt),
            lte(tasks.reminderAt, now),
            isNull(tasks.reminderSentAt),
            isNotNull(tasks.dueAt),
            gt(tasks.dueAt, now),
            isNull(tasks.completedAt),
            isNotNull(tasks.assigneeMemberId),
          ),
        )
        .orderBy(asc(tasks.reminderAt))
        .limit(limit)
        .for('update', { skipLocked: true });

      const claimed: Task[] = [];

      for (const candidate of candidates) {
        const [task] = await transaction
          .update(tasks)
          .set({
            reminderSentAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(tasks.id, candidate.id),
              isNull(tasks.reminderSentAt),
              isNotNull(tasks.reminderAt),
              lte(tasks.reminderAt, now),
            ),
          )
          .returning();

        if (task) {
          claimed.push(task);
        }
      }

      return claimed;
    });
  }

  public async releaseClaim(taskId: string): Promise<void> {
    await this.database
      .update(tasks)
      .set({
        reminderSentAt: null,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), isNotNull(tasks.reminderSentAt)));
  }

  public async findContext(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<TaskReminderContext | null> {
    const [result] = await this.database
      .select({
        taskId: tasks.id,
        workspaceId: tasks.workspaceId,
        projectId: tasks.projectId,
        title: tasks.title,
        taskNumber: tasks.taskNumber,
        columnId: tasks.columnId,
        dueAt: tasks.dueAt,
        columnKind: projectColumns.kind,
        completedAt: tasks.completedAt,
        assigneeMemberId: tasks.assigneeMemberId,
        projectName: projects.name,
        projectKey: projects.key,
        projectArchivedAt: projects.archivedAt,
        workspaceName: workspaces.name,
        recipientEmail: users.email,
        recipientFirstName: users.firstName,
        recipientStatus: users.status,
      })
      .from(tasks)
      .innerJoin(
        projectColumns,
        and(
          eq(projectColumns.id, tasks.columnId),
          eq(projectColumns.projectId, tasks.projectId),
        ),
      )
      .innerJoin(
        projects,
        and(
          eq(projects.id, tasks.projectId),
          eq(projects.workspaceId, tasks.workspaceId),
        ),
      )
      .innerJoin(workspaces, eq(workspaces.id, tasks.workspaceId))
      .innerJoin(
        workspaceMembers,
        and(
          eq(workspaceMembers.id, tasks.assigneeMemberId),
          eq(workspaceMembers.workspaceId, tasks.workspaceId),
        ),
      )
      .innerJoin(users, eq(users.id, workspaceMembers.userId))
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .limit(1);

    return result ?? null;
  }
}
