import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHash } from 'node:crypto';

import type { WorkspaceInvitation } from '../database/schema';
import { MailService } from '../infrastructure/mail/mail.service';
import { SEND_INVITATION_EMAIL_JOB } from '../infrastructure/queue/queue.constants';
import type {
  InvitationEmailJob,
  InvitationEmailJobData,
} from '../infrastructure/queue/queue.types';
import { WorkspaceInvitationsRepository } from '../modules/workspace-invitations/workspace-invitations.repository';
import { InvitationEmailProcessor } from './invitation-email.processor';

describe('InvitationEmailProcessor', () => {
  let processor: InvitationEmailProcessor;

  let findById: jest.MockedFunction<WorkspaceInvitationsRepository['findById']>;

  let sendWorkspaceInvitation: jest.MockedFunction<
    MailService['sendWorkspaceInvitation']
  >;

  const now = new Date('2026-07-24T10:00:00.000Z');

  const rawToken = 'valid-invitation-token-with-enough-characters-123456789';

  const tokenHash = createHash('sha256').update(rawToken).digest('hex');

  const invitation: WorkspaceInvitation = {
    id: '9dcd3290-f117-4a4c-bdad-3f4c39ee4bbd',

    workspaceId: '6eea0d06-9ebb-492b-820c-6f08638e5eef',

    email: 'member@example.com',
    role: 'member',
    tokenHash,
    status: 'pending',

    invitedByUserId: '2e01067b-0ae0-431c-8833-d7b2d77518f0',

    acceptedByUserId: null,

    expiresAt: new Date('2026-08-01T12:00:00.000Z'),

    acceptedAt: null,
    declinedAt: null,
    cancelledAt: null,

    lastSentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const jobData: InvitationEmailJobData = {
    invitationId: invitation.id,
    workspaceId: invitation.workspaceId,
    recipientEmail: invitation.email,
    inviterName: 'Workspace Owner',
    workspaceName: 'TaskFlow',
    role: 'member',
    rawToken,
    expiresAt: invitation.expiresAt.toISOString(),
  };

  const job: InvitationEmailJob = {
    id: 'invitation-email-' + invitation.id + '-fingerprint',

    name: SEND_INVITATION_EMAIL_JOB,
    data: jobData,
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    jest.setSystemTime(now);

    findById = jest.fn();

    sendWorkspaceInvitation = jest.fn();

    sendWorkspaceInvitation.mockResolvedValue('resend-email-id');

    const moduleReference = await Test.createTestingModule({
      providers: [
        InvitationEmailProcessor,

        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string): string => {
              if (key === 'FRONTEND_URL') {
                return 'http://localhost:5173/';
              }

              throw new Error(`Unexpected configuration key: ${key}`);
            }),
          },
        },

        {
          provide: WorkspaceInvitationsRepository,
          useValue: {
            findById,
          },
        },

        {
          provide: MailService,
          useValue: {
            sendWorkspaceInvitation,
          },
        },
      ],
    }).compile();

    processor = moduleReference.get(InvitationEmailProcessor);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('sends a valid pending invitation email', async () => {
    findById.mockResolvedValue(invitation);

    await processor.process(job);

    expect(findById).toHaveBeenCalledWith(
      invitation.workspaceId,
      invitation.id,
    );

    expect(sendWorkspaceInvitation).toHaveBeenCalledWith({
      recipientEmail: 'member@example.com',
      inviterName: 'Workspace Owner',
      workspaceName: 'TaskFlow',
      role: 'member',

      invitationUrl:
        `http://localhost:5173/invitations/` + encodeURIComponent(rawToken),

      expiresAt: invitation.expiresAt,

      idempotencyKey: `workspace-invitation/${job.id}`,
    });
  });

  it('ignores a deleted invitation', async () => {
    findById.mockResolvedValue(null);

    await processor.process(job);

    expect(sendWorkspaceInvitation).not.toHaveBeenCalled();
  });

  it.each(['cancelled', 'accepted', 'declined'] as const)(
    'ignores an invitation with %s status',
    async (status) => {
      findById.mockResolvedValue({
        ...invitation,
        status,
      });

      await processor.process(job);

      expect(sendWorkspaceInvitation).not.toHaveBeenCalled();
    },
  );

  it('ignores an expired invitation', async () => {
    findById.mockResolvedValue({
      ...invitation,
      expiresAt: new Date('2026-07-23T10:00:00.000Z'),
    });

    await processor.process(job);

    expect(sendWorkspaceInvitation).not.toHaveBeenCalled();
  });

  it('ignores a stale resend job', async () => {
    const replacementTokenHash = createHash('sha256')
      .update('newer-invitation-token')
      .digest('hex');

    findById.mockResolvedValue({
      ...invitation,
      tokenHash: replacementTokenHash,
    });

    await processor.process(job);

    expect(sendWorkspaceInvitation).not.toHaveBeenCalled();
  });

  it('rethrows mail errors so BullMQ can retry', async () => {
    const providerError = new Error('Resend temporarily unavailable');

    findById.mockResolvedValue(invitation);

    sendWorkspaceInvitation.mockRejectedValue(providerError);

    await expect(processor.process(job)).rejects.toBe(providerError);
  });
});
