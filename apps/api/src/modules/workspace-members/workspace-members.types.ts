import type { WorkspaceRole } from '../../database/schema';

export interface WorkspaceMemberResponse {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;

  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'active' | 'disabled';
  };
}
