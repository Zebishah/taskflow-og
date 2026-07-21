import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

    const workspaceId = request.params.workspaceId;

    const userId = request.user?.sub;

    if (!workspaceId || !userId) {
      throw new NotFoundException('Workspace was not found');
    }

    request.workspaceContext =
      await this.workspacesService.getMembershipContext(
        Array.isArray(workspaceId) ? workspaceId[0] : workspaceId,
        userId,
      );

    return true;
  }
}
