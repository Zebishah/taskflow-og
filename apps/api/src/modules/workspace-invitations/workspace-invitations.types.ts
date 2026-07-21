import type {
  WorkspaceInvitationStatus,
  WorkspaceRole,
} from '../../database/schema';

export interface WorkspaceInvitationResponse {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceInvitationStatus;
  expiresAt: Date;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;

  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InvitationPreviewResponse {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  };

  inviter: {
    firstName: string;
    lastName: string;
  };

  recipientEmail: string;
  role: WorkspaceRole;
  status: WorkspaceInvitationStatus | 'expired';

  expiresAt: Date;
}

export interface CreatedInvitationResult {
  invitation: WorkspaceInvitationResponse;
  rawToken: string;
}

export interface AcceptedInvitationResponse {
  workspaceId: string;
  membershipId: string;
  role: WorkspaceRole;
}
