import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './infrastructure/cache/cache.module';
// DISABLED BullMQ restore hooks (keep commented — do not enable without Redis queues):
// import { BullBoardModule } from './infrastructure/bull-board/bull-board.module';
// import { QueueModule } from './infrastructure/queue/queue.module';

import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceMembersModule } from './modules/workspace-members/workspace-members.module';
import { WorkspaceInvitationsModule } from './modules/workspace-invitations/workspace-invitations.module';
import { ProjectsModule } from './modules/projects/project.module';
import { TasksModule } from './modules/tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    CacheModule,
    HealthModule,
    // BullBoardModule, // DISABLED — BullMQ dashboard preserved but unused
    UsersModule,
    AuthModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    WorkspaceInvitationsModule,
    ProjectsModule,
    TasksModule,
  ],
})
export class AppModule {}
