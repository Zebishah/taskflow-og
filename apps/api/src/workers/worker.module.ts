/*
 * ============================================================================
 * DISABLED — BullMQ WorkerModule is preserved for later restore only.
 * Do NOT start workers/worker.ts. Active reminders use RemindersModule cron.
 * ============================================================================
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from '../config/environment.validation';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from '../infrastructure/mail/mail.module';
import { WorkspaceInvitationsRepository } from '../modules/workspace-invitations/workspace-invitations.repository';

import { InvitationEmailWorker } from './invitation-email.worker';
import { InvitationEmailProcessor } from './invitation-email.processor';
import { TaskReminderProcessor } from './task-reminder.processor';
import { TaskReminderRepository } from './task-reminder.repository';
import { TaskReminderWorker } from './task-reminder.worker';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),

    DatabaseModule,
    MailModule,
  ],

  providers: [
    WorkspaceInvitationsRepository,
    InvitationEmailProcessor,
    InvitationEmailWorker,

    TaskReminderRepository,
    TaskReminderProcessor,
    TaskReminderWorker,
  ],
})
export class WorkerModule {}
