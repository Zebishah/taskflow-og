import {
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

import {
  INVITATION_EMAIL_QUEUE,
  INVITATION_EMAIL_QUEUE_NAME,
} from './queue.constants';
import { InvitationEmailQueueService } from './invitation-email-queue.service';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from './queue.types';
import { createRedisConnectionOptions } from './redis-connection';

@Injectable()
class QueueLifecycleService implements OnApplicationShutdown {
  public constructor(
    @Inject(INVITATION_EMAIL_QUEUE)
    private readonly queue: Queue<
      InvitationEmailJobData,
      void,
      InvitationEmailJobName
    >,
  ) {}

  public async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}

@Module({
  providers: [
    {
      provide: INVITATION_EMAIL_QUEUE,
      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ): Queue<InvitationEmailJobData, void, InvitationEmailJobName> => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Queue<InvitationEmailJobData, void, InvitationEmailJobName>(
          INVITATION_EMAIL_QUEUE_NAME,
          {
            connection: createRedisConnectionOptions(redisUrl, false),
          },
        );
      },
    },

    InvitationEmailQueueService,
    QueueLifecycleService,
  ],

  exports: [InvitationEmailQueueService],
})
export class QueueModule {}
