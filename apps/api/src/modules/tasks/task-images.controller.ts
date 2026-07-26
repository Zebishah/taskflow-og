import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { ConfirmTaskImageUploadDto } from './dto/confirm-task-image-upload.dto';
import { CreateTaskImageUploadDto } from './dto/create-task-image-upload.dto';
import { TaskImagesService } from './task-images.service';
import type {
  TaskImageResponse,
  TaskImageUploadIntent,
} from './task-images.types';

@Controller('workspaces/:workspaceId/projects/:projectId/tasks/:taskId/image')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspaceRoleGuard)
export class TaskImagesController {
  public constructor(private readonly taskImagesService: TaskImagesService) {}

  @Post('upload-intent')
  public async createUploadIntent(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: CreateTaskImageUploadDto,
  ): Promise<TaskImageUploadIntent> {
    return this.taskImagesService.createUploadIntent(
      context,
      projectId,
      taskId,
      dto,
    );
  }

  @Post('confirm')
  public async confirmUpload(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: ConfirmTaskImageUploadDto,
  ): Promise<TaskImageResponse> {
    return this.taskImagesService.confirmUpload(
      context,
      projectId,
      taskId,
      dto,
    );
  }

  @Get()
  public async findImage(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<TaskImageResponse> {
    return this.taskImagesService.findImage(context, projectId, taskId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeImage(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('taskId', new ParseUUIDPipe({ version: '4' }))
    taskId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.taskImagesService.removeImage(context, projectId, taskId);
  }
}
