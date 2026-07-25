import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ilike, isNull, sql, type SQL } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  ProjectColumn,
  projectColumns,
  projects,
  tasks,
  workspaceMembers,
  type Project,
  type Task,
} from '../../database/schema';
import type {
  CreateTaskRepositoryInput,
  TaskFilters,
  UpdateTaskRepositoryInput,
} from './tasks.types';

@Injectable()
export class TasksRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async findProjectById(
    workspaceId: string,
    projectId: string,
  ): Promise<Project | null> {
    const [project] = await this.database
      .select()
      .from(projects)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId)),
      )
      .limit(1);

    return project ?? null;
  }

  public async membershipExists(
    workspaceId: string,
    membershipId: string,
  ): Promise<boolean> {
    const [membership] = await this.database
      .select({
        id: workspaceMembers.id,
      })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
        ),
      )
      .limit(1);

    return membership !== undefined;
  }

  public async create(input: CreateTaskRepositoryInput): Promise<Task | null> {
    /*
     * The project counter update and task insert happen
     * in one transaction.
     *
     * PostgreSQL locks the project row during the update.
     * Two requests therefore cannot receive the same
     * task number.
     */
    return this.database.transaction(async (transaction) => {
      const [updatedProject] = await transaction
        .update(projects)
        .set({
          nextTaskNumber: sql`${projects.nextTaskNumber} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.workspaceId, input.workspaceId),
            eq(projects.id, input.projectId),
            isNull(projects.archivedAt),
          ),
        )
        .returning({
          nextTaskNumber: projects.nextTaskNumber,
        });

      if (!updatedProject) {
        return null;
      }

      const taskNumber = updatedProject.nextTaskNumber - 1;

      const [task] = await transaction
        .insert(tasks)
        .values({
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          createdByUserId: input.createdByUserId,
          assigneeMemberId: input.assigneeMemberId,
          columnId: input.columnId,
          taskNumber,
          title: input.title,
          description: input.description,
          priority: input.priority,
          position: taskNumber * 1_000,
          dueAt: input.dueAt,
          completedAt: input.completedAt,
        })
        .returning();

      if (!task) {
        throw new Error('Task creation returned no record');
      }

      return task;
    });
  }

  public async findAll(
    workspaceId: string,
    projectId: string,
    filters: TaskFilters,
  ): Promise<Task[]> {
    const conditions: SQL[] = [
      eq(tasks.workspaceId, workspaceId),
      eq(tasks.projectId, projectId),
    ];
    if (filters.columnId !== undefined) {
      conditions.push(eq(tasks.columnId, filters.columnId));
    }

    if (filters.priority !== undefined) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.assigneeMemberId !== undefined) {
      conditions.push(eq(tasks.assigneeMemberId, filters.assigneeMemberId));
    }

    if (filters.search) {
      conditions.push(ilike(tasks.title, `%${filters.search}%`));
    }

    return this.database
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(asc(tasks.columnId), asc(tasks.position), asc(tasks.createdAt));
  }
  public async findColumnById(
    projectId: string,
    columnId: string,
  ): Promise<ProjectColumn | null> {
    const [column] = await this.database
      .select()
      .from(projectColumns)
      .where(
        and(
          eq(projectColumns.projectId, projectId),
          eq(projectColumns.id, columnId),
        ),
      )
      .limit(1);

    return column ?? null;
  }

  public async findDefaultColumn(
    projectId: string,
  ): Promise<ProjectColumn | null> {
    const [column] = await this.database
      .select()
      .from(projectColumns)
      .where(eq(projectColumns.projectId, projectId))
      .orderBy(
        sql`
        CASE ${projectColumns.kind}
          WHEN 'active' THEN 0
          WHEN 'backlog' THEN 1
          ELSE 2
        END
      `,
        asc(projectColumns.position),
      )
      .limit(1);

    return column ?? null;
  }
  public async findById(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task | null> {
    const [task] = await this.database
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .limit(1);

    return task ?? null;
  }

  public async update(
    workspaceId: string,
    projectId: string,
    taskId: string,
    input: UpdateTaskRepositoryInput,
  ): Promise<Task | null> {
    const [task] = await this.database
      .update(tasks)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .returning();

    return task ?? null;
  }

  public async delete(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task | null> {
    const [task] = await this.database
      .delete(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .returning();

    return task ?? null;
  }
}
