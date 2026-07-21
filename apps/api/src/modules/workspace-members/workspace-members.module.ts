import { Module } from '@nestjs/common';

import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersService } from './workspace-members.service';

@Module({
  imports: [WorkspacesModule],

  controllers: [WorkspaceMembersController],

  providers: [WorkspaceMembersRepository, WorkspaceMembersService],

  exports: [WorkspaceMembersRepository, WorkspaceMembersService],
})
export class WorkspaceMembersModule {}
