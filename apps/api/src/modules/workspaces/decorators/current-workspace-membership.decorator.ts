import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

import type {
  WorkspaceAuthenticatedRequest,
  WorkspaceMembershipContext,
} from '../workspaces.types';

export const CurrentWorkspaceMembership = createParamDecorator(
  (
    _data: unknown,
    executionContext: ExecutionContext,
  ): WorkspaceMembershipContext => {
    const request = executionContext
      .switchToHttp()
      .getRequest<WorkspaceAuthenticatedRequest>();

    if (!request.workspaceContext) {
      throw new InternalServerErrorException(
        'Workspace context was not initialized',
      );
    }

    return request.workspaceContext;
  },
);
