import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import type {
  Workspace,
  WorkspaceInvitation,
  WorkspaceMember,
} from '../../database/schema';
import { MailService } from '../../infrastructure/mail/mail.service';
import type { AccessTokenPayload } from '../auth/auth.types';
import { WorkspaceMembersRepository } from '../workspace-members/workspace-members.repository';
import { WorkspacesService } from '../workspaces/workspaces.service';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import { WorkspaceInvitationsRepository } from './workspace-invitations.repository';
import { WorkspaceInvitationsService } from './workspace-invitations.service';
import type { WorkspaceInvitationResponse } from './workspace-invitations.types';

describe('WorkspaceInvitationsService email sending', () => {
  let service: WorkspaceInvitationsService;

  let findPendingByEmail: jest.MockedFunction<
    WorkspaceInvitationsRepository['findPendingByEmail']
  >;

  let createInvitation: jest.MockedFunction<
    WorkspaceInvitationsRepository['create']
  >;

  let findAllForWorkspace: jest.MockedFunction<
    WorkspaceInvitationsRepository['findAllForWorkspace']
  >;

  let deletePendingByTokenHash: jest.MockedFunction<
    WorkspaceInvitationsRepository['deletePendingByTokenHash']
  >;

  let existsByEmail: jest.MockedFunction<
    WorkspaceMembersRepository['existsByEmail']
  >;

  let findResponseByUserId: jest.MockedFunction<
    WorkspaceMembersRepository['findResponseByUserId']
  >;

  let sendWorkspaceInvitation: jest.MockedFunction<
    MailService['sendWorkspaceInvitation']
  >;

  const now = new Date('2026-07-24T10:00:00.000Z');

  const workspace: Workspace = {
    id: '6eea0d06-9ebb-492b-820c-6f08638e5eef',
    name: 'TaskFlow',
    slug: 'taskflow',
    description: null,
    createdAt: now,
    updatedAt: now,
  };

  const membership: WorkspaceMember = {
    id: '8c872ad6-c359-4e5e-b645-ae2944043750',
    workspaceId: workspace.id,

    userId: '2e01067b-0ae0-431c-8833-d7b2d77518f0',

    role: 'owner',
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const context: WorkspaceMembershipContext = {
    workspace,
    membership,
  };

  const inviter: AccessTokenPayload = {
    sub: membership.userId,
    email: 'owner@example.com',
    type: 'access',
  };

  const databaseInvitation: WorkspaceInvitation = {
    id: '9dcd3290-f117-4a4c-bdad-3f4c39ee4bbd',
    workspaceId: workspace.id,
    email: 'member@example.com',
    role: 'member',

    tokenHash:
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' + 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',

    status: 'pending',

    invitedByUserId: membership.userId,
    acceptedByUserId: null,

    expiresAt: new Date('2026-07-31T10:00:00.000Z'),

    acceptedAt: null,
    declinedAt: null,
    cancelledAt: null,

    lastSentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  const invitationResponse: WorkspaceInvitationResponse = {
    id: databaseInvitation.id,
    workspaceId: databaseInvitation.workspaceId,
    email: databaseInvitation.email,
    role: databaseInvitation.role,
    status: databaseInvitation.status,
    expiresAt: databaseInvitation.expiresAt,
    lastSentAt: databaseInvitation.lastSentAt,
    createdAt: databaseInvitation.createdAt,
    updatedAt: databaseInvitation.updatedAt,

    invitedBy: {
      id: membership.userId,
      firstName: 'Workspace',
      lastName: 'Owner',
      email: inviter.email,
    },
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    findPendingByEmail = jest.fn();
    createInvitation = jest.fn();
    findAllForWorkspace = jest.fn();
    deletePendingByTokenHash = jest.fn();

    existsByEmail = jest.fn();
    findResponseByUserId = jest.fn();

    sendWorkspaceInvitation = jest.fn();

    findPendingByEmail.mockResolvedValue(null);
    createInvitation.mockResolvedValue(databaseInvitation);

    findAllForWorkspace.mockResolvedValue([invitationResponse]);

    deletePendingByTokenHash.mockResolvedValue(true);

    existsByEmail.mockResolvedValue(false);

    findResponseByUserId.mockResolvedValue({
      id: membership.id,
      workspaceId: workspace.id,
      userId: membership.userId,
      role: membership.role,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,

      user: {
        id: membership.userId,
        email: inviter.email,
        firstName: 'Workspace',
        lastName: 'Owner',
        status: 'active',
      },
    });

    sendWorkspaceInvitation.mockResolvedValue('email-id');

    const moduleReference = await Test.createTestingModule({
      providers: [
        WorkspaceInvitationsService,

        {
          provide: WorkspaceInvitationsRepository,

          useValue: {
            findPendingByEmail,
            create: createInvitation,
            findAllForWorkspace,
            deletePendingByTokenHash,
          },
        },

        {
          provide: WorkspaceMembersRepository,

          useValue: {
            existsByEmail,
            findResponseByUserId,
          },
        },

        {
          provide: MailService,

          useValue: {
            sendWorkspaceInvitation,
          },
        },

        {
          provide: WorkspacesService,

          useValue: {
            invalidateMembership: jest.fn().mockResolvedValue(undefined),
          },
        },

        {
          provide: ConfigService,

          useValue: {
            get: jest.fn((key: string): number | undefined => {
              if (key === 'WORKSPACE_INVITATION_TTL_HOURS') {
                return 168;
              }

              return undefined;
            }),
            getOrThrow: jest.fn((key: string): string => {
              if (key === 'FRONTEND_URL') {
                return 'http://localhost:5173';
              }

              throw new Error(`Unexpected config key ${key}`);
            }),
          },
        },
      ],
    }).compile();

    service = moduleReference.get(WorkspaceInvitationsService);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('sends an email immediately after creating an invitation', async () => {
    const result = await service.create(context, inviter, {
      email: ' MEMBER@EXAMPLE.COM ',
      role: 'member',
    });

    expect(sendWorkspaceInvitation).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientEmail: 'member@example.com',
        inviterName: 'Workspace Owner',
        workspaceName: 'TaskFlow',
        role: 'member',
        invitationUrl: expect.stringContaining(
          'http://localhost:5173/invitations/',
        ) as string,
        expiresAt: new Date('2026-07-31T10:00:00.000Z'),
      }),
    );

    expect(result).toEqual(invitationResponse);
  });

  it('removes the invitation when sending fails', async () => {
    sendWorkspaceInvitation.mockRejectedValue(new Error('Resend unavailable'));

    await expect(
      service.create(context, inviter, {
        email: 'member@example.com',
        role: 'member',
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(deletePendingByTokenHash).toHaveBeenCalledWith(
      databaseInvitation.id,
      expect.any(String),
    );

    expect(findAllForWorkspace).not.toHaveBeenCalled();
  });
});
