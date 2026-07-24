import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { createBullBoard } from '@bull-board/api';
import { ExpressAdapter } from '@bull-board/express';
import { Inject, Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import type { Router } from 'express';

import { INVITATION_EMAIL_QUEUE } from '../queue/queue.constants';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from '../queue/queue.types';

@Injectable()
export class BullBoardService {
  private readonly serverAdapter = new ExpressAdapter();

  public constructor(
    @Inject(INVITATION_EMAIL_QUEUE)
    invitationEmailQueue: Queue<
      InvitationEmailJobData,
      void,
      InvitationEmailJobName
    >,
  ) {
    createBullBoard({
      queues: [
        new BullMQAdapter(invitationEmailQueue, {
          readOnlyMode: true,
          description: 'TaskFlow workspace invitation emails',
        }),
      ],

      serverAdapter: this.serverAdapter,

      options: {
        uiConfig: {
          boardTitle: 'TaskFlow Queues',
          miscLinks: [],
        },
      },
    });
  }

  public setBasePath(basePath: string): void {
    this.serverAdapter.setBasePath(basePath);
  }

  public getRouter(): Router {
    return this.serverAdapter.getRouter() as Router;
  }
}
