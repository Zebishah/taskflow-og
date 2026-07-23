export interface InvitationEmailJobData {
  invitationId: string;
  workspaceId: string;
  recipientEmail: string;
  inviterName: string;
  workspaceName: string;
  role: 'admin' | 'member';
  rawToken: string;
  expiresAt: string;
}

export type InvitationEmailJobName = 'send-invitation-email';

/**
 * This smaller interface contains only the BullMQ job
 * properties needed by our business processor.
 *
 * Unit tests can create this object without constructing
 * a real BullMQ Job instance.
 */
export interface InvitationEmailJob {
  id?: string;
  name: InvitationEmailJobName;
  data: InvitationEmailJobData;
}
