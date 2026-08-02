import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { WorkspaceRoleGuard } from './guards/workspace-role.guard';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesRepository } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [WorkspacesController],
  providers: [
    WorkspacesRepository,
    WorkspacesService,
    WorkspaceAccessGuard,
    WorkspaceRoleGuard,
  ],
  exports: [
    WorkspacesRepository,
    WorkspacesService,
    WorkspaceAccessGuard,
    WorkspaceRoleGuard,
  ],
})
export class WorkspacesModule {}
