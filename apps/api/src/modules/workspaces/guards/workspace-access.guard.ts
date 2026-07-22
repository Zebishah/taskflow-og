import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import { WorkspacesService } from '../workspaces.service';
import type { WorkspaceAuthenticatedRequest } from '../workspaces.types';

@Injectable()
export class WorkspaceAccessGuard implements CanActivate {
  public constructor(private readonly workspacesService: WorkspacesService) {}

  public async canActivate(
    executionContext: ExecutionContext,
  ): Promise<boolean> {
    const request = executionContext
      .switchToHttp()
      .getRequest<WorkspaceAuthenticatedRequest>();

    const workspaceIdParameter = request.params.workspaceId;

    const workspaceId = Array.isArray(workspaceIdParameter)
      ? workspaceIdParameter[0]
      : workspaceIdParameter;

    const userId = request.user?.sub;

    /*
     * Guards execute before controller pipes.
     * We must therefore validate the UUID here before
     * passing it into a PostgreSQL UUID comparison.
     */
    if (!workspaceId || !isUUID(workspaceId, '4') || !userId) {
      throw new NotFoundException('Workspace was not found');
    }

    request.workspaceContext =
      await this.workspacesService.getMembershipContext(workspaceId, userId);

    return true;
  }
}
