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

import type { ProjectColumn } from '../../database/schema';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectColumnDto } from './dto/project-columns/create-project-column.dto';
import { DeleteProjectColumnQueryDto } from './dto/project-columns/delete-project-column-query.dto';
import { ReorderProjectColumnsDto } from './dto/project-columns/reorder-project-columns.dto';
import { UpdateProjectColumnDto } from './dto/project-columns/update-project-column.dto';
import { ProjectColumnsService } from './project-columns.service';

@Controller('workspaces/:workspaceId/projects/:projectId/columns')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
export class ProjectColumnsController {
  public constructor(private readonly service: ProjectColumnsService) {}

  @Get()
  public findAll(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<ProjectColumn[]> {
    return this.service.findAll(context, projectId);
  }

  @Post()
  public create(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: CreateProjectColumnDto,
  ): Promise<ProjectColumn> {
    return this.service.create(context, projectId, dto);
  }

  @Patch('reorder')
  public reorder(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: ReorderProjectColumnsDto,
  ): Promise<ProjectColumn[]> {
    return this.service.reorder(context, projectId, dto);
  }

  @Patch(':columnId')
  public update(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('columnId', new ParseUUIDPipe({ version: '4' }))
    columnId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: UpdateProjectColumnDto,
  ): Promise<ProjectColumn> {
    return this.service.update(context, projectId, columnId, dto);
  }

  @Delete(':columnId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('workspaceId', new ParseUUIDPipe({ version: '4' }))
    _workspaceId: string,

    @Param('projectId', new ParseUUIDPipe({ version: '4' }))
    projectId: string,

    @Param('columnId', new ParseUUIDPipe({ version: '4' }))
    columnId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Query()
    query: DeleteProjectColumnQueryDto,
  ): Promise<void> {
    await this.service.remove(
      context,
      projectId,
      columnId,
      query.moveTasksToColumnId,
    );
  }
}
