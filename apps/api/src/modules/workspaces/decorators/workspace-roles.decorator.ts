import { SetMetadata } from '@nestjs/common';

import type { WorkspaceRole } from '../../../database/schema';

export const WORKSPACE_ROLES_KEY = 'workspace_roles';

export const WorkspaceRoles = (
  ...roles: WorkspaceRole[]
): MethodDecorator & ClassDecorator => SetMetadata(WORKSPACE_ROLES_KEY, roles);
