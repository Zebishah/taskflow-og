import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';

import {
  INVITATION_EMAIL_QUEUE,
  SEND_INVITATION_EMAIL_JOB,
} from './queue.constants';
import { InvitationEmailQueueService } from './invitation-email-queue.service';
import type {
  InvitationEmailJobData,
  InvitationEmailJobName,
} from './queue.types';

interface AddJobResult {
  id?: string;
  name: InvitationEmailJobName;
}

type AddJob = (
  name: InvitationEmailJobName,
  data: InvitationEmailJobData,
  options: {
    jobId: string;
    attempts: number;
    backoff: {
      type: string;
      delay: number;
    };
    removeOnComplete: {
      age: number;
      count: number;
    };
    removeOnFail: {
      age: number;
      count: number;
    };
  },
) => Promise<AddJobResult>;

describe('InvitationEmailQueueService', () => {
  let service: InvitationEmailQueueService;
  let addJob: jest.MockedFunction<AddJob>;

  const jobData: InvitationEmailJobData = {
    invitationId: '9dcd3290-f117-4a4c-bdad-3f4c39ee4bbd',

    workspaceId: '6eea0d06-9ebb-492b-820c-6f08638e5eef',

    recipientEmail: 'member@example.com',
    inviterName: 'Workspace Owner',
    workspaceName: 'TaskFlow',
    role: 'member',

    rawToken: 'test-invitation-token-with-enough-characters-123456789',

    expiresAt: '2026-08-01T12:00:00.000Z',
  };

  beforeEach(async () => {
    addJob = jest.fn();

    addJob.mockResolvedValue({
      id: 'generated-job-id',
      name: SEND_INVITATION_EMAIL_JOB,
    });

    const moduleReference = await Test.createTestingModule({
      providers: [
        InvitationEmailQueueService,

        {
          provide: INVITATION_EMAIL_QUEUE,
          useValue: {
            add: addJob,
          },
        },
      ],
    }).compile();

    service = moduleReference.get(InvitationEmailQueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('adds the correct invitation email job', async () => {
    await service.enqueue(jobData);

    const fingerprint = createHash('sha256')
      .update(jobData.rawToken)
      .digest('hex')
      .slice(0, 16);

    expect(addJob).toHaveBeenCalledWith(
      SEND_INVITATION_EMAIL_JOB,
      jobData,
      expect.objectContaining({
        jobId: `invitation-email-${jobData.invitationId}-` + fingerprint,
      }),
    );
  });

  it('configures retries and exponential backoff', async () => {
    await service.enqueue(jobData);

    expect(addJob).toHaveBeenCalledWith(
      SEND_INVITATION_EMAIL_JOB,
      jobData,
      expect.objectContaining({
        attempts: 5,

        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
      }),
    );
  });

  it('keeps completed and failed job history', async () => {
    await service.enqueue(jobData);

    expect(addJob).toHaveBeenCalledWith(
      SEND_INVITATION_EMAIL_JOB,
      jobData,
      expect.objectContaining({
        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 1_000,
        },

        removeOnFail: {
          age: 7 * 24 * 60 * 60,
          count: 5_000,
        },
      }),
    );
  });

  it('rethrows queue errors', async () => {
    const redisError = new Error('Redis unavailable');

    addJob.mockRejectedValue(redisError);

    await expect(service.enqueue(jobData)).rejects.toBe(redisError);
  });
});
