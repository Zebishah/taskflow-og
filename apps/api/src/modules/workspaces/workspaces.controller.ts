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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from './decorators/current-workspace-membership.decorator';
import { WorkspaceRoles } from './decorators/workspace-roles.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspacesService } from './workspaces.service';
import type {
  WorkspaceDetails,
  WorkspaceMembershipContext,
  WorkspaceWithRole,
} from './workspaces.types';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  public constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  public async findAll(
    @CurrentUser()
    user: AccessTokenPayload,
  ): Promise<WorkspaceWithRole[]> {
    return this.workspacesService.findAllForUser(user.sub);
  }

  @Post()
  public async create(
    @CurrentUser()
    user: AccessTokenPayload,

    @Body()
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceWithRole> {
    return this.workspacesService.create(user.sub, dto);
  }

  @Get(':workspaceId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  public async findOne(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<WorkspaceDetails> {
    return this.workspacesService.findDetails(context);
  }

  @Patch(':workspaceId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  public async update(
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
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceWithRole> {
    return this.workspacesService.update(context, dto);
  }

  @Delete(':workspaceId')
  @UseGuards(WorkspaceAccessGuard, WorkspaceRoleGuard)
  @WorkspaceRoles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async delete(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.workspacesService.delete(context);
  }
}
