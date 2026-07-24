/*
 * Invitation email queue
 */

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

export interface InvitationEmailJob {
  id?: string;
  name: InvitationEmailJobName;
  data: InvitationEmailJobData;
}

/*
 * Task reminder queue
 */

export interface TaskReminderJobData {
  taskId: string;
  workspaceId: string;
  projectId: string;
  assigneeMemberId: string;
  dueAt: string;
}

export type TaskReminderJobName = 'send-task-due-reminder';

export interface TaskReminderJob {
  id?: string;
  name: TaskReminderJobName;
  data: TaskReminderJobData;
}
