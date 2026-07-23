import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Project, Task, WorkspaceRole } from '../../database/schema';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './tasks.repository';
import type { UpdateTaskRepositoryInput } from './tasks.types';

@Injectable()
export class TasksService {
  public constructor(private readonly tasksRepository: TasksRepository) {}

  public async create(
    context: WorkspaceMembershipContext,
    projectId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    if (dto.assigneeMemberId !== undefined) {
      await this.assertValidAssignee(
        context.workspace.id,
        dto.assigneeMemberId,
      );
    }

    const task = await this.tasksRepository.create({
      workspaceId: context.workspace.id,
      projectId,
      createdByUserId: context.membership.userId,
      assigneeMemberId: dto.assigneeMemberId ?? null,
      title: dto.title.trim(),
      description: this.normalizeDescription(dto.description),
      status: dto.status ?? 'todo',
      priority: dto.priority ?? 'medium',
      dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
    });

    /*
     * This can happen if the project was archived
     * after our first project check but before the
     * transaction updated its task counter.
     */
    if (!task) {
      throw new ConflictException(
        'The project was changed or archived before the task could be created',
      );
    }

    return task;
  }

  public async findAll(
    context: WorkspaceMembershipContext,
    projectId: string,
    query: ListTasksQueryDto,
  ): Promise<Task[]> {
    await this.findProjectOrFail(context.workspace.id, projectId);

    return this.tasksRepository.findAll(context.workspace.id, projectId, {
      status: query.status,
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
    await this.findProjectOrFail(context.workspace.id, projectId);

    return this.findTaskOrFail(context.workspace.id, projectId, taskId);
  }

  public async update(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    const existingTask = await this.findTaskOrFail(
      context.workspace.id,
      projectId,
      taskId,
    );

    if (dto.assigneeMemberId !== undefined && dto.assigneeMemberId !== null) {
      await this.assertValidAssignee(
        context.workspace.id,
        dto.assigneeMemberId,
      );
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

    if (dto.status !== undefined) {
      updateData.status = dto.status;

      if (dto.status === 'done' && existingTask.status !== 'done') {
        updateData.completedAt = new Date();
      }

      if (dto.status !== 'done' && existingTask.status === 'done') {
        updateData.completedAt = null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return existingTask;
    }

    const task = await this.tasksRepository.update(
      context.workspace.id,
      projectId,
      taskId,
      updateData,
    );

    if (!task) {
      throw new NotFoundException('Task was not found');
    }

    return task;
  }

  public async delete(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    this.assertCanDeleteTasks(context.membership.role);

    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    await this.findTaskOrFail(context.workspace.id, projectId, taskId);

    const deletedTask = await this.tasksRepository.delete(
      context.workspace.id,
      projectId,
      taskId,
    );

    if (!deletedTask) {
      throw new NotFoundException('Task was not found');
    }
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
    if (project.archivedAt) {
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

    return normalizedValue ? normalizedValue : null;
  }
}
