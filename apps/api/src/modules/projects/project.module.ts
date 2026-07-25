import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectColumnsController } from './project-columns.controller';
import { ProjectColumnsRepository } from './project-columns.repository';
import { ProjectColumnsService } from './project-columns.service';
import { ProjectsController } from './projects.controller';
import { ProjectsRepository } from './projects.repository';
import { ProjectsService } from './projects.service';

@Module({
  imports: [AuthModule, WorkspacesModule],

  controllers: [ProjectsController, ProjectColumnsController],

  providers: [
    ProjectsRepository,
    ProjectsService,
    ProjectColumnsRepository,
    ProjectColumnsService,
  ],

  exports: [
    ProjectsRepository,
    ProjectsService,
    ProjectColumnsRepository,
    ProjectColumnsService,
  ],
})
export class ProjectsModule {}
