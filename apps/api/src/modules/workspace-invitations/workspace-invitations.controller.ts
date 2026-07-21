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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AccessTokenPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentWorkspaceMembership } from '../workspaces/decorators/current-workspace-membership.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { CreateWorkspaceInvitationDto } from './dto/create-workspace-invitation.dto';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import type {
  AcceptedInvitationResponse,
  InvitationPreviewResponse,
  WorkspaceInvitationResponse,
} from './workspace-invitations.types';

@Controller()
export class WorkspaceInvitationsController {
  public constructor(
    private readonly invitationsService: WorkspaceInvitationsService,
  ) {}

  @Get('workspaces/:workspaceId/invitations')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
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
  ): Promise<WorkspaceInvitationResponse[]> {
    return this.invitationsService.findAll(context);
  }

  @Post('workspaces/:workspaceId/invitations')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
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

    @CurrentUser()
    user: AccessTokenPayload,

    @Body()
    dto: CreateWorkspaceInvitationDto,
  ): Promise<WorkspaceInvitationResponse> {
    return this.invitationsService.create(context, user, dto);
  }

  @Post('workspaces/:workspaceId/invitations/:invitationId/resend')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async resend(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'invitationId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    invitationId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.invitationsService.resend(context, invitationId);
  }

  @Delete('workspaces/:workspaceId/invitations/:invitationId')
  @UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async cancel(
    @Param(
      'workspaceId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    _workspaceId: string,

    @Param(
      'invitationId',
      new ParseUUIDPipe({
        version: '4',
      }),
    )
    invitationId: string,

    @CurrentWorkspaceMembership()
    context: WorkspaceMembershipContext,
  ): Promise<void> {
    await this.invitationsService.cancel(context, invitationId);
  }

  @Get('invitations/:token')
  public async preview(
    @Param('token')
    token: string,
  ): Promise<InvitationPreviewResponse> {
    return this.invitationsService.preview(token);
  }

  @Post('invitations/:token/accept')
  @UseGuards(JwtAuthGuard)
  public async accept(
    @Param('token')
    token: string,

    @CurrentUser()
    user: AccessTokenPayload,
  ): Promise<AcceptedInvitationResponse> {
    return this.invitationsService.accept(token, user);
  }

  @Post('invitations/:token/decline')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  public async decline(
    @Param('token')
    token: string,

    @CurrentUser()
    user: AccessTokenPayload,
  ): Promise<void> {
    await this.invitationsService.decline(token, user);
  }
}
