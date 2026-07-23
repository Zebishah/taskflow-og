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
