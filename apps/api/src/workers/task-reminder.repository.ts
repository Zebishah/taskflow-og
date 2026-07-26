import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import {
  projectColumns,
  projects,
  tasks,
  users,
  workspaceMembers,
  workspaces,
} from '../database/schema';

export interface TaskReminderContext {
  taskId: string;
  workspaceId: string;
  projectId: string;
  title: string;
  taskNumber: number;
  status?: string;
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
