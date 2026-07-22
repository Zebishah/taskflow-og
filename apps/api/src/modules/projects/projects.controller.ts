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
  UseGuards,
} from '@nestjs/common';

import type { Project } from '../../database/schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceRoles } from '../workspaces/decorators/workspace-roles.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { WorkspaceRoleGuard } from '../workspaces/guards/workspace-role.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, WorkspaceRoleGuard)
export class ProjectsController {
  public constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @WorkspaceRoles('owner', 'admin')
  public async create(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: CreateProjectDto,
  ): Promise<Project> {
    return this.projectsService.create(context, dto);
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

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<Project[]> {
    return this.projectsService.findAll(context);
  }

  @Get(':projectId')
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

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<Project> {
    return this.projectsService.findOne(context, projectId);
  }

  @Patch(':projectId')
  @WorkspaceRoles('owner', 'admin')
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

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: UpdateProjectDto,
  ): Promise<Project> {
    return this.projectsService.update(context, projectId, dto);
  }

  /*
   * DELETE means archive here. The database row is
   * preserved so future tasks are not destroyed.
   */
  @Delete(':projectId')
  @WorkspaceRoles('owner', 'admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async archive(
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
  ): Promise<void> {
    await this.projectsService.archive(context, projectId);
  }

  @Patch(':projectId/restore')
  @WorkspaceRoles('owner', 'admin')
  public async restore(
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
  ): Promise<Project> {
    return this.projectsService.restore(context, projectId);
  }
}
