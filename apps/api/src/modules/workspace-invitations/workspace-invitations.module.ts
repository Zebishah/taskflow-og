import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceMembersModule } from '../workspace-members/workspace-members.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceInvitationsController } from './workspace-invitations.controller';
import { WorkspaceInvitationsRepository } from './workspace-invitations.repository';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import { QueueModule } from '../../infrastructure/queue/queue.module';

@Module({
  imports: [AuthModule, QueueModule, WorkspacesModule, WorkspaceMembersModule],

  controllers: [WorkspaceInvitationsController],

  providers: [WorkspaceInvitationsRepository, WorkspaceInvitationsService],

  exports: [WorkspaceInvitationsRepository, WorkspaceInvitationsService],
})
export class WorkspaceInvitationsModule {}
