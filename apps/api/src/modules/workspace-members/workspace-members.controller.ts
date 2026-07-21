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
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspaceMembersService } from './workspace-members.service';
import type { WorkspaceMemberResponse } from './workspace-members.types';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
export class WorkspaceMembersController {
  public constructor(
    private readonly workspaceMembersService: WorkspaceMembersService,
  ) {}

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
  ): Promise<WorkspaceMemberResponse[]> {
    return this.workspaceMembersService.findAll(context);
  }

  @Patch(':memberId/role')
  public async updateRole(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'memberId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    memberId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,

    @Body()
    dto: UpdateMemberRoleDto,
  ) {
    return this.workspaceMembersService.updateRole(context, memberId, dto);
  }

  @Delete(':memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'memberId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    memberId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.workspaceMembersService.remove(context, memberId);
  }
}
