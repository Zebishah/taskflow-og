import type { Request } from 'express';

import type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from '../../database/schema';
import type { AccessTokenPayload } from '../auth/auth.types';

export interface WorkspaceMembershipContext {
  workspace: Workspace;
  membership: WorkspaceMember;
}

export interface WorkspaceAuthenticatedRequest extends Request {
  user: AccessTokenPayload;
  workspaceContext?: WorkspaceMembershipContext;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface WorkspaceDetails extends WorkspaceWithRole {
  memberCount: number;
}
