import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MailModule } from '../mail/mail.module';
import { TaskReminderDispatchService } from './task-reminder-dispatch.service';
import { TaskReminderPendingTracker } from './task-reminder-pending.tracker';
import { TaskReminderScheduleService } from './task-reminder-schedule.service';
import { TaskReminderRepository } from './task-reminder.repository';

@Module({
  imports: [ScheduleModule.forRoot(), MailModule],

  providers: [
    TaskReminderRepository,
    TaskReminderPendingTracker,
    TaskReminderScheduleService,
    TaskReminderDispatchService,
  ],

  exports: [TaskReminderScheduleService],
})
export class RemindersModule {}
