import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MailModule } from '../mail/mail.module';
import { TaskReminderDispatchService } from './task-reminder-dispatch.service';
import { TaskReminderScheduleService } from './task-reminder-schedule.service';
import { TaskReminderRepository } from './task-reminder.repository';

@Module({
  imports: [ScheduleModule.forRoot(), MailModule],

  providers: [
    TaskReminderRepository,
    TaskReminderScheduleService,
    TaskReminderDispatchService,
  ],

  exports: [TaskReminderScheduleService],
})
export class RemindersModule {}
