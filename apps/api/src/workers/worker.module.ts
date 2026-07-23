import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateEnvironment } from '../config/environment.validation';
import { DatabaseModule } from '../database/database.module';
import { MailModule } from '../infrastructure/mail/mail.module';
import { WorkspaceInvitationsRepository } from '../modules/workspace-invitations/workspace-invitations.repository';
import { InvitationEmailWorker } from './invitation-email.worker';

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

  providers: [WorkspaceInvitationsRepository, InvitationEmailWorker],
})
export class WorkerModule {}
