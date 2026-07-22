import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from './config/environment.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceMembersModule } from './modules/workspace-members/workspace-members.module';
import { WorkspaceInvitationsModule } from './modules/workspace-invitations/workspace-invitations.module';
import { ProjectsModule } from './modules/projects/project.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    HealthModule,
    UsersModule,
    AuthModule,
    WorkspacesModule,
    WorkspaceMembersModule,
    WorkspaceInvitationsModule,
    ProjectsModule,
  ],
})
export class AppModule {}
