import { Queue, QueueEvents, Worker } from 'bullmq';

import { InvitationEmailQueueService } from '../src/infrastructure/queue/invitation-email-queue.service';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from '../src/infrastructure/queue/queue.types';
import { createRedisConnectionOptions } from '../src/infrastructure/queue/redis-connection';
import { createHash } from 'node:crypto';

import { SEND_INVITATION_EMAIL_JOB } from '../src/infrastructure/queue/queue.constants';
describe('Invitation email queue integration', () => {
  let queue: Queue<InvitationEmailJobData, void, InvitationEmailJobName>;

  let queueEvents: QueueEvents;

  let worker: Worker<InvitationEmailJobData, void, InvitationEmailJobName>;

  let service: InvitationEmailQueueService;

  const processedJobs: InvitationEmailJobData[] = [];

  const queueName = `invitation-email-test-${process.pid}`;

  beforeAll(async () => {
    const redisUrl = process.env.TEST_REDIS_URL;

    if (!redisUrl) {
      throw new Error('TEST_REDIS_URL is required for Redis integration tests');
    }

    const parsedUrl = new URL(redisUrl);

    /*
     * Safety protection: database 0 is used for normal
     * development. This test requires a separate database.
     */
    if (parsedUrl.pathname !== '/15') {
      throw new Error('Redis integration tests require Redis database 15');
    }

    queue = new Queue<InvitationEmailJobData, void, InvitationEmailJobName>(
      queueName,
      {
        connection: createRedisConnectionOptions(redisUrl, false),
      },
    );

    queueEvents = new QueueEvents(queueName, {
      connection: createRedisConnectionOptions(redisUrl, true),
    });

    await queueEvents.waitUntilReady();

    worker = new Worker<InvitationEmailJobData, void, InvitationEmailJobName>(
      queueName,

      (job) => {
        processedJobs.push(job.data);

        return Promise.resolve();
      },

      {
        connection: createRedisConnectionOptions(redisUrl, true),

        concurrency: 1,
      },
    );

    await worker.waitUntilReady();

    /*
     * Nest injection is not needed here because the
     * service only depends on a BullMQ Queue instance.
     */
    service = new InvitationEmailQueueService(queue);
  });

  beforeEach(async () => {
    processedJobs.length = 0;

    await queue.drain(true);
    await queue.clean(0, 1_000, 'completed');
    await queue.clean(0, 1_000, 'failed');
  });

  afterAll(async () => {
    await worker.close();
    await queueEvents.close();

    await queue.obliterate({
      force: true,
    });

    await queue.close();
  });

  it('moves a real job through Redis to the worker', async () => {
    const data: InvitationEmailJobData = {
      invitationId: '9dcd3290-f117-4a4c-bdad-3f4c39ee4bbd',

      workspaceId: '6eea0d06-9ebb-492b-820c-6f08638e5eef',

      recipientEmail: 'member@example.com',

      inviterName: 'Workspace Owner',

      workspaceName: 'TaskFlow',

      role: 'member',

      rawToken: 'integration-token-with-enough-characters-123456789',

      expiresAt: '2026-08-01T12:00:00.000Z',
    };

    await service.enqueue(data);

    const tokenFingerprint = createHash('sha256')
      .update(data.rawToken)
      .digest('hex')
      .slice(0, 16);

    const jobId = `invitation-email-${data.invitationId}-` + tokenFingerprint;

    const job = await queue.getJob(jobId);

    if (!job) {
      throw new Error(`BullMQ job ${jobId} was not created`);
    }

    expect(job.name).toBe(SEND_INVITATION_EMAIL_JOB);

    await job.waitUntilFinished(queueEvents, 10_000);

    expect(processedJobs).toContainEqual(data);

    const counts = await queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
    );

    expect(counts.waiting).toBe(0);
    expect(counts.active).toBe(0);
    expect(counts.completed).toBe(1);
    expect(counts.failed).toBe(0);
  });
});
