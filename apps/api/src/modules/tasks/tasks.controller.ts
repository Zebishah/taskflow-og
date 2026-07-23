import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { Task } from '../../database/schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceRoles } from '../workspaces/decorators/workspace-roles.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspaceRoleGuard)
export class TasksController {
  public constructor(private readonly tasksService: TasksService) {}

  @Post()
  public async create(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'projectId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    projectId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(context, projectId, dto);
  }

  @Get()
  public async findAll(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'projectId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    projectId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Query()
    query: ListTasksQueryDto,
  ): Promise<Task[]> {
    return this.tasksService.findAll(context, projectId, query);
  }

  @Get(':taskId')
  public async findOne(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'projectId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    projectId: string,

    @Param(
      'taskId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<Task> {
    return this.tasksService.findOne(context, projectId, taskId);
  }

  @Patch(':taskId')
  public async update(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'projectId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    projectId: string,

    @Param(
      'taskId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: UpdateTaskDto,
  ): Promise<Task> {
    return this.tasksService.update(context, projectId, taskId, dto);
  }

  @Delete(':taskId')
  @WorkspaceRoles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'projectId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    projectId: string,

    @Param(
      'taskId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.tasksService.delete(context, projectId, taskId);
  }
}
