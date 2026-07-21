import { Module } from '@nestjs/common';

import { MailModule } from '../../infrastructure/mail/mail.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceInvitationsController } from './workspace-invitations.controller';
import { WorkspaceInvitationsRepository } from './workspace-invitations.repository';
import { WorkspaceInvitationsService } from './workspace-invitations.service';

@Module({
  imports: [MailModule, WorkspacesModule, WorkspaceMembersModule],

  controllers: [WorkspaceInvitationsController],

  providers: [WorkspaceInvitationsRepository, WorkspaceInvitationsService],

  exports: [WorkspaceInvitationsRepository, WorkspaceInvitationsService],
})
export class WorkspaceInvitationsModule {}
