import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [AuthModule, WorkspacesModule],

  controllers: [TasksController],

  providers: [TasksRepository, TasksService],

  exports: [TasksRepository, TasksService],
})
export class TasksModule {}
