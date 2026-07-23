export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
}

export interface WorkspaceInvitationMailInput {
  recipientEmail: string;
  inviterName: string;
  workspaceName: string;
  role: 'admin' | 'member';
  invitationUrl: string;
  expiresAt: Date;
  idempotencyKey: string;
}
