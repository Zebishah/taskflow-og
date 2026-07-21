import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { WorkspaceRole } from '../../../database/schema';
import { WORKSPACE_ROLES_KEY } from '../decorators/workspace-roles.decorator';
import type { WorkspaceAuthenticatedRequest } from '../workspaces.types';

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
  public constructor(private readonly reflector: Reflector) {}

  public canActivate(executionContext: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
      WORKSPACE_ROLES_KEY,
      [executionContext.getHandler(), executionContext.getClass()],
    );

    /*
     * No @WorkspaceRoles() decorator means this route
     * only requires workspace membership.
     */
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const request = executionContext
      .switchToHttp()
      .getRequest<WorkspaceAuthenticatedRequest>();

    const membership = request.workspaceContext?.membership;

    if (!membership) {
      throw new InternalServerErrorException(
        'Workspace membership was not initialized',
      );
    }

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
