import { Module } from '@nestjs/common';

import { CacheModule } from '../../infrastructure/cache/cache.module';
import { RemindersModule } from '../../infrastructure/reminders/reminders.module';
import { S3StorageModule } from '../../infrastructure/storage/s3-storage.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { TaskImagesController } from './task-images.controller';
import { TaskImagesRepository } from './task-images.repository';
import { TaskImagesService } from './task-images.service';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    AuthModule,
    WorkspacesModule,
    RemindersModule,
    CacheModule,
    S3StorageModule,
  ],

  controllers: [TasksController, TaskImagesController],

  providers: [
    TasksRepository,
    TasksService,
    TaskImagesRepository,
    TaskImagesService,
  ],

  exports: [
    TasksRepository,
    TasksService,
    TaskImagesRepository,
    TaskImagesService,
  ],
})
export class TasksModule {}
