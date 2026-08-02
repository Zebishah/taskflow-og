import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { WorkspaceMember } from '../../database/schema';
import { CACHE_TTL_SECONDS } from '../../infrastructure/cache/cache.constants';
import { CacheKeys } from '../../infrastructure/cache/cache.keys';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { reviveDatesInObject } from '../../infrastructure/cache/cache.revive';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import type { WorkspaceMemberResponse } from './workspace-members.types';

@Injectable()
export class WorkspaceMembersService {
  public constructor(
    private readonly workspaceMembersRepository: WorkspaceMembersRepository,
    private readonly cacheService: CacheService,
  ) {}

  public async findAll(
    context: WorkspaceMembershipContext,
  ): Promise<WorkspaceMemberResponse[]> {
    const cacheKey = CacheKeys.workspaceMembers(context.workspace.id);
    const cached =
      await this.cacheService.getJson<WorkspaceMemberResponse[]>(cacheKey);

    if (cached) {
      return cached.map((member) =>
        reviveDatesInObject(member, ['joinedAt', 'createdAt', 'updatedAt']),
      );
    }

    const members = await this.workspaceMembersRepository.findAll(
      context.workspace.id,
    );

    await this.cacheService.setJson(
      cacheKey,
      members,
      CACHE_TTL_SECONDS.membersList,
    );

    return members;
  }

  public async updateRole(
    context: WorkspaceMembershipContext,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<WorkspaceMember> {
    this.assertOwner(context);

    const targetMember = await this.findTargetMember(
      context.workspace.id,
      memberId,
    );

    if (targetMember.role === 'owner') {
      throw new ForbiddenException(
        'The workspace owner role cannot be changed here',
      );
    }

    const updatedMember = await this.workspaceMembersRepository.updateRole(
      targetMember.id,
      dto.role,
    );

    if (!updatedMember) {
      throw new NotFoundException('Workspace member was not found');
    }

    await this.cacheService.del(
      CacheKeys.workspaceMembers(context.workspace.id),
      CacheKeys.membership(context.workspace.id, targetMember.userId),
      CacheKeys.userWorkspaces(targetMember.userId),
    );

    return updatedMember;
  }

  public async remove(
    context: WorkspaceMembershipContext,
    memberId: string,
  ): Promise<void> {
    const targetMember = await this.findTargetMember(
      context.workspace.id,
      memberId,
    );

    if (targetMember.role === 'owner') {
      throw new ForbiddenException('The workspace owner cannot be removed');
    }

    if (targetMember.userId === context.membership.userId) {
      throw new ForbiddenException(
        'Use the leave-workspace operation to remove yourself',
      );
    }

    if (context.membership.role === 'member') {
      throw new ForbiddenException('Members cannot remove workspace members');
    }

    /*
     * Admins may remove ordinary members.
     * Only the owner may remove another admin.
     */
    if (context.membership.role === 'admin' && targetMember.role !== 'member') {
      throw new ForbiddenException('Admins can only remove members');
    }

    const removed = await this.workspaceMembersRepository.remove(
      targetMember.id,
    );

    if (!removed) {
      throw new NotFoundException('Workspace member was not found');
    }

    await this.cacheService.del(
      CacheKeys.workspaceMembers(context.workspace.id),
      CacheKeys.membership(context.workspace.id, targetMember.userId),
      CacheKeys.userWorkspaces(targetMember.userId),
    );
  }

  private async findTargetMember(
    workspaceId: string,
    memberId: string,
  ): Promise<WorkspaceMember> {
    const member = await this.workspaceMembersRepository.findById(
      workspaceId,
      memberId,
    );

    if (!member) {
      throw new NotFoundException('Workspace member was not found');
    }

    return member;
  }

  private assertOwner(context: WorkspaceMembershipContext): void {
    if (context.membership.role !== 'owner') {
      throw new ForbiddenException(
        'Only the workspace owner can change member roles',
      );
    }
  }
}
