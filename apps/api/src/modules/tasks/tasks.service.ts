import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import type {
  Project,
  ProjectColumn,
  Task,
  WorkspaceRole,
} from '../../database/schema';
import { TaskReminderQueueService } from '../../infrastructure/queue/task-reminder-queue.service';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './tasks.repository';
import type { UpdateTaskRepositoryInput } from './tasks.types';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  public constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly taskReminderQueueService: TaskReminderQueueService,
  ) {}

  public async create(
    context: WorkspaceMembershipContext,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const workspaceId = context.workspace.id;

    const project = await this.findProjectOrFail(workspaceId, projectId);

    this.assertProjectIsActive(project);

    if (dto.assigneeMemberId !== undefined) {
      await this.assertValidAssignee(workspaceId, dto.assigneeMemberId);
    }

    /*
     * If the frontend selected a column, validate it.
     * Otherwise, use the project's default active column.
     */
    const column =
      dto.columnId !== undefined
        ? await this.findColumnOrFail(projectId, dto.columnId)
        : await this.findDefaultColumnOrFail(projectId);

    const task = await this.tasksRepository.create({
      workspaceId,
      projectId,
      createdByUserId: context.membership.userId,
      assigneeMemberId: dto.assigneeMemberId ?? null,
      columnId: column.id,
      title: dto.title.trim(),
      description: this.normalizeDescription(dto.description),
      priority: dto.priority ?? 'medium',
      dueAt: dto.dueAt !== undefined ? new Date(dto.dueAt) : null,

      /*
       * Creating a task inside a completion column means
       * it is already completed.
       */
      completedAt: column.kind === 'done' ? new Date() : null,
    });

    /*
     * The repository returns null when the project is
     * archived between the initial check and its transaction.
     */
    if (!task) {
      throw new ConflictException(
        'The project was changed or archived before the task could be created',
      );
    }

    await this.reconcileReminderSafely(null, task);

    return task;
  }

  public async findAll(
    context: WorkspaceMembershipContext,
    projectId: string,
    query: ListTasksQueryDto,
  ): Promise<Task[]> {
    const workspaceId = context.workspace.id;

    await this.findProjectOrFail(workspaceId, projectId);

    /*
     * Validate a column filter so a column belonging to
     * another project cannot be supplied.
     */
    if (query.columnId !== undefined) {
      await this.findColumnOrFail(projectId, query.columnId);
    }

    return this.tasksRepository.findAll(workspaceId, projectId, {
      columnId: query.columnId,
      priority: query.priority,
      assigneeMemberId: query.assigneeMemberId,
      search: query.search,
    });
  }

  public async findOne(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
  ): Promise<Task> {
    const workspaceId = context.workspace.id;

    await this.findProjectOrFail(workspaceId, projectId);

    return this.findTaskOrFail(workspaceId, projectId, taskId);
  }

  public async update(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const workspaceId = context.workspace.id;

    const project = await this.findProjectOrFail(workspaceId, projectId);

    this.assertProjectIsActive(project);

    const existingTask = await this.findTaskOrFail(
      workspaceId,
      projectId,
      taskId,
    );

    if (dto.assigneeMemberId !== undefined && dto.assigneeMemberId !== null) {
      await this.assertValidAssignee(workspaceId, dto.assigneeMemberId);
    }

    const updateData: UpdateTaskRepositoryInput = {};

    if (dto.title !== undefined) {
      updateData.title = dto.title.trim();
    }

    if (dto.description !== undefined) {
      updateData.description =
        dto.description === null
          ? null
          : this.normalizeDescription(dto.description);
    }

    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }

    if (dto.assigneeMemberId !== undefined) {
      updateData.assigneeMemberId = dto.assigneeMemberId;
    }

    if (dto.dueAt !== undefined) {
      updateData.dueAt = dto.dueAt === null ? null : new Date(dto.dueAt);
    }

    /*
     * A task now moves by changing columnId instead
     * of changing a fixed status enum.
     */
    if (dto.columnId !== undefined) {
      const destinationColumn = await this.findColumnOrFail(
        projectId,
        dto.columnId,
      );

      updateData.columnId = destinationColumn.id;

      if (destinationColumn.kind === 'done') {
        /*
         * Preserve the original completion time when
         * moving between two completion columns.
         */
        updateData.completedAt = existingTask.completedAt ?? new Date();
      } else {
        /*
         * Moving a completed task back to backlog or
         * active work reopens it.
         */
        updateData.completedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingTask;
    }

    const updatedTask = await this.tasksRepository.update(
      workspaceId,
      projectId,
      taskId,
      updateData,
    );

    if (!updatedTask) {
      throw new NotFoundException('Task was not found');
    }

    if (this.didReminderConfigurationChange(existingTask, updatedTask)) {
      await this.reconcileReminderSafely(existingTask, updatedTask);
    }

    return updatedTask;
  }

  public async delete(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    this.assertCanDeleteTasks(context.membership.role);

    const workspaceId = context.workspace.id;

    const project = await this.findProjectOrFail(workspaceId, projectId);

    this.assertProjectIsActive(project);

    const existingTask = await this.findTaskOrFail(
      workspaceId,
      projectId,
      taskId,
    );

    const deletedTask = await this.tasksRepository.delete(
      workspaceId,
      projectId,
      taskId,
    );

    if (!deletedTask) {
      throw new NotFoundException('Task was not found');
    }

    /*
     * Cancel the reminder after successful deletion.
     *
     * The previous implementation cancelled the reminder
     * before deleting the task. If deletion failed, the
     * task would incorrectly remain without a reminder.
     */
    await this.reconcileReminderSafely(existingTask, null);
  }

  private async findProjectOrFail(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.tasksRepository.findProjectById(
      workspaceId,
      projectId,
    );

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    return project;
  }

  private async findTaskOrFail(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findById(
      workspaceId,
      projectId,
      taskId,
    );

    if (!task) {
      throw new NotFoundException('Task was not found');
    }

    return task;
  }

  private async findColumnOrFail(
    projectId: string,
    columnId: string,
  ): Promise<ProjectColumn> {
    const column = await this.tasksRepository.findColumnById(
      projectId,
      columnId,
    );

    if (!column) {
      throw new NotFoundException('The selected project column was not found');
    }

    return column;
  }

  private async findDefaultColumnOrFail(
    projectId: string,
  ): Promise<ProjectColumn> {
    const column = await this.tasksRepository.findDefaultColumn(projectId);

    if (!column) {
      throw new ConflictException(
        'The project does not have an available task column',
      );
    }

    return column;
  }

  private async assertValidAssignee(
    workspaceId: string,
    membershipId: string,
  ): Promise<void> {
    const membershipExists = await this.tasksRepository.membershipExists(
      workspaceId,
      membershipId,
    );

    if (!membershipExists) {
      throw new NotFoundException(
        'The selected assignee is not a member of this workspace',
      );
    }
  }

  private assertProjectIsActive(project: Project): void {
    if (project.archivedAt !== null) {
      throw new ConflictException(
        'Restore this project before modifying its tasks',
      );
    }
  }

  private assertCanDeleteTasks(role: WorkspaceRole): void {
    const allowedRoles: readonly WorkspaceRole[] = ['owner', 'admin'];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        'Only workspace owners and administrators can delete tasks',
      );
    }
  }

  private normalizeDescription(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue || null;
  }

  private didReminderConfigurationChange(
    previousTask: Task,
    currentTask: Task,
  ): boolean {
    return (
      previousTask.assigneeMemberId !== currentTask.assigneeMemberId ||
      !this.areDatesEqual(previousTask.dueAt, currentTask.dueAt) ||
      !this.areDatesEqual(previousTask.completedAt, currentTask.completedAt)
    );
  }

  private areDatesEqual(first: Date | null, second: Date | null): boolean {
    if (first === null || second === null) {
      return first === second;
    }

    return first.getTime() === second.getTime();
  }

  private async reconcileReminderSafely(
    previousTask: Task | null,
    currentTask: Task | null,
  ): Promise<void> {
    try {
      await this.taskReminderQueueService.reconcile(previousTask, currentTask);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

      this.logger.error(
        'Task was saved, but its reminder could not be synchronized',
        message,
      );
    }
  }
}
