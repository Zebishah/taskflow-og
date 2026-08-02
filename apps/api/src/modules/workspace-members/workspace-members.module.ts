import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersService } from './workspace-members.service';

@Module({
  imports: [AuthModule, WorkspacesModule, CacheModule],

  controllers: [WorkspaceMembersController],

  providers: [WorkspaceMembersRepository, WorkspaceMembersService],

  exports: [WorkspaceMembersRepository, WorkspaceMembersService],
})
export class WorkspaceMembersModule {}
