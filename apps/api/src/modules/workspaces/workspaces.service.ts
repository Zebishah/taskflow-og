import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { WorkspaceRole } from '../../database/schema';
import { CACHE_TTL_SECONDS } from '../../infrastructure/cache/cache.constants';
import { CacheKeys } from '../../infrastructure/cache/cache.keys';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { reviveDatesInObject } from '../../infrastructure/cache/cache.revive';
import type { CreateWorkspaceDto } from './dto/create-workspace.dto';
import type { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { WorkspacesRepository } from './workspaces.repository';
import type {
  WorkspaceDetails,
  WorkspaceMembershipContext,
  WorkspaceWithRole,
} from './workspaces.types';

@Injectable()
export class WorkspacesService {
  public constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly cacheService: CacheService,
  ) {}

  public async create(
    userId: string,
    dto: CreateWorkspaceDto,
  ): Promise<WorkspaceWithRole> {
    const name = dto.name.trim();
    const slug = this.normalizeSlug(dto.slug);
    const description = this.normalizeDescription(dto.description);

    const existingWorkspace = await this.workspacesRepository.findBySlug(slug);

    if (existingWorkspace) {
      throw new ConflictException('A workspace with this slug already exists');
    }

    try {
      const result = await this.workspacesRepository.createWithOwner({
        creatorId: userId,
        name,
        slug,
        description,
      });

      await this.cacheService.del(CacheKeys.userWorkspaces(userId));

      return {
        ...result.workspace,
        role: result.membership.role,
      };
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'A workspace with this slug already exists',
        );
      }

      throw error;
    }
  }

  public async findAllForUser(userId: string): Promise<WorkspaceWithRole[]> {
    const key = CacheKeys.userWorkspaces(userId);

    const cached =
      await this.cacheService.getJson<WorkspaceWithRole[]>(key);

    if (cached) {
      return cached.map((workspace) =>
        reviveDatesInObject(workspace, ['createdAt', 'updatedAt']),
      );
    }

    const results = await this.workspacesRepository.findAllForUser(userId);

    const mapped = results.map((result) => ({
      ...result.workspace,
      role: result.role,
    }));

    await this.cacheService.setJson(
      key,
      mapped,
      CACHE_TTL_SECONDS.workspacesList,
    );

    return mapped;
  }

  public async getMembershipContext(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMembershipContext> {
    const key = CacheKeys.membership(workspaceId, userId);

    const cached =
      await this.cacheService.getJson<WorkspaceMembershipContext>(key);

    if (cached) {
      return {
        workspace: reviveDatesInObject(cached.workspace, [
          'createdAt',
          'updatedAt',
        ]),
        membership: reviveDatesInObject(cached.membership, [
          'joinedAt',
          'createdAt',
          'updatedAt',
        ]),
      };
    }

    const result = await this.workspacesRepository.findWorkspaceAndMembership(
      workspaceId,
      userId,
    );

    if (!result) {
      throw new NotFoundException('Workspace was not found');
    }

    await this.cacheService.setJson(
      key,
      result,
      CACHE_TTL_SECONDS.membership,
    );

    return result;
  }

  public async findDetails(
    context: WorkspaceMembershipContext,
  ): Promise<WorkspaceDetails> {
    const memberCount = await this.workspacesRepository.countMembers(
      context.workspace.id,
    );

    return {
      ...context.workspace,
      role: context.membership.role,
      memberCount,
    };
  }

  public async update(
    context: WorkspaceMembershipContext,
    dto: UpdateWorkspaceDto,
  ): Promise<WorkspaceWithRole> {
    this.assertAllowedRole(
      context.membership.role,
      ['owner'],
      'Only the workspace owner can update workspace settings',
    );

    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const slug = this.normalizeSlug(dto.slug);

      if (slug !== context.workspace.slug) {
        const existingWorkspace =
          await this.workspacesRepository.findBySlug(slug);

        if (existingWorkspace) {
          throw new ConflictException(
            'A workspace with this slug already exists',
          );
        }
      }

      updateData.slug = slug;
    }

    if (dto.description !== undefined) {
      updateData.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(updateData).length === 0) {
      return {
        ...context.workspace,
        role: context.membership.role,
      };
    }

    try {
      const workspace = await this.workspacesRepository.update(
        context.workspace.id,
        updateData,
      );

      if (!workspace) {
        throw new NotFoundException('Workspace was not found');
      }

      await this.invalidateWorkspaceCaches(
        context.workspace.id,
        context.membership.userId,
      );

      return {
        ...workspace,
        role: context.membership.role,
      };
    } catch (error: unknown) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new ConflictException(
          'A workspace with this slug already exists',
        );
      }

      throw error;
    }
  }

  public async delete(context: WorkspaceMembershipContext): Promise<void> {
    this.assertAllowedRole(
      context.membership.role,
      ['owner'],
      'Only the workspace owner can delete this workspace',
    );

    const deleted = await this.workspacesRepository.delete(
      context.workspace.id,
    );

    if (!deleted) {
      throw new NotFoundException('Workspace was not found');
    }

    await this.invalidateWorkspaceCaches(
      context.workspace.id,
      context.membership.userId,
    );
  }

  public async invalidateMembership(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    await this.cacheService.del(
      CacheKeys.membership(workspaceId, userId),
      CacheKeys.userWorkspaces(userId),
      CacheKeys.workspaceMembers(workspaceId),
    );
  }

  private async invalidateWorkspaceCaches(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    await this.cacheService.del(
      CacheKeys.userWorkspaces(userId),
      CacheKeys.membership(workspaceId, userId),
      CacheKeys.workspaceProjects(workspaceId),
      CacheKeys.workspaceMembers(workspaceId),
    );
  }

  private assertAllowedRole(
    actualRole: WorkspaceRole,
    allowedRoles: readonly WorkspaceRole[],
    message: string,
  ): void {
    if (!allowedRoles.includes(actualRole)) {
      throw new ForbiddenException(message);
    }
  }

  private normalizeSlug(value: string): string {
    return value.trim().toLowerCase();
  }

  private normalizeDescription(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : null;
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('code' in error)) {
      return false;
    }

    return error.code === '23505';
  }
}
