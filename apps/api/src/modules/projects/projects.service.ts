import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Project, WorkspaceRole } from '../../database/schema';
import { CACHE_TTL_SECONDS } from '../../infrastructure/cache/cache.constants';
import { CacheKeys } from '../../infrastructure/cache/cache.keys';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { reviveDatesInObject } from '../../infrastructure/cache/cache.revive';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectsService {
  public constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly cacheService: CacheService,
  ) {}

  public async create(
    context: WorkspaceMembershipContext,
    dto: CreateProjectDto,
  ): Promise<Project> {
    this.assertCanManageProjects(context.membership.role);

    const name = dto.name.trim();
    const key = this.normalizeKey(dto.key);
    const description = this.normalizeDescription(dto.description);

    const existingProject = await this.projectsRepository.findByKey(
      context.workspace.id,
      key,
    );

    if (existingProject) {
      throw new ConflictException(
        `A project with the key "${key}" already exists in this workspace`,
      );
    }

    try {
      const project = await this.projectsRepository.create({
        workspaceId: context.workspace.id,
        createdByUserId: context.membership.userId,
        name,
        key,
        description,
      });

      await this.cacheService.del(
        CacheKeys.workspaceProjects(context.workspace.id),
      );

      return project;
    } catch (error: unknown) {
      if (this.hasPostgresErrorCode(error, '23505')) {
        throw new ConflictException(
          `A project with the key "${key}" already exists in this workspace`,
        );
      }

      throw error;
    }
  }

  public async findAll(
    context: WorkspaceMembershipContext,
  ): Promise<Project[]> {
    const cacheKey = CacheKeys.workspaceProjects(context.workspace.id);

    const cached = await this.cacheService.getJson<Project[]>(cacheKey);

    if (cached) {
      return cached.map((project) =>
        reviveDatesInObject(project, [
          'archivedAt',
          'createdAt',
          'updatedAt',
        ]),
      );
    }

    const projects = await this.projectsRepository.findAll(
      context.workspace.id,
    );

    await this.cacheService.setJson(
      cacheKey,
      projects,
      CACHE_TTL_SECONDS.projectsList,
    );

    return projects;
  }

  public async findOne(
    context: WorkspaceMembershipContext,
    projectId: string,
  ): Promise<Project> {
    return this.findProjectOrFail(context.workspace.id, projectId);
  }

  public async update(
    context: WorkspaceMembershipContext,
    projectId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    this.assertCanManageProjects(context.membership.role);

    const existingProject = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    if (existingProject.archivedAt) {
      throw new ConflictException('Restore this project before updating it');
    }

    const updateData: {
      name?: string;
      key?: string;
      description?: string | null;
    } = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.key !== undefined) {
      const key = this.normalizeKey(dto.key);

      if (key !== existingProject.key) {
        const projectWithKey = await this.projectsRepository.findByKey(
          context.workspace.id,
          key,
        );

        if (projectWithKey) {
          throw new ConflictException(
            `A project with the key "${key}" already exists in this workspace`,
          );
        }
      }

      updateData.key = key;
    }

    if (dto.description !== undefined) {
      updateData.description = this.normalizeDescription(dto.description);
    }

    if (Object.keys(updateData).length === 0) {
      return existingProject;
    }

    try {
      const project = await this.projectsRepository.update(
        context.workspace.id,
        projectId,
        updateData,
      );

      if (!project) {
        throw new NotFoundException('Project was not found');
      }

      await this.cacheService.del(
        CacheKeys.workspaceProjects(context.workspace.id),
      );

      return project;
    } catch (error: unknown) {
      if (this.hasPostgresErrorCode(error, '23505')) {
        throw new ConflictException(
          'A project with this key already exists in this workspace',
        );
      }

      throw error;
    }
  }

  public async archive(
    context: WorkspaceMembershipContext,
    projectId: string,
  ): Promise<void> {
    this.assertCanManageProjects(context.membership.role);

    const existingProject = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    if (existingProject.archivedAt) {
      throw new ConflictException('Project is already archived');
    }

    const archivedProject = await this.projectsRepository.archive(
      context.workspace.id,
      projectId,
    );

    if (!archivedProject) {
      throw new ConflictException(
        'Project could not be archived because it was already changed',
      );
    }

    await this.cacheService.del(
      CacheKeys.workspaceProjects(context.workspace.id),
      CacheKeys.projectColumns(projectId),
      CacheKeys.projectTasks(context.workspace.id, projectId),
    );
  }

  public async restore(
    context: WorkspaceMembershipContext,
    projectId: string,
  ): Promise<Project> {
    this.assertCanManageProjects(context.membership.role);

    const existingProject = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    if (!existingProject.archivedAt) {
      throw new ConflictException('Project is already active');
    }

    const restoredProject = await this.projectsRepository.restore(
      context.workspace.id,
      projectId,
    );

    if (!restoredProject) {
      throw new ConflictException(
        'Project could not be restored because it was already changed',
      );
    }

    await this.cacheService.del(
      CacheKeys.workspaceProjects(context.workspace.id),
    );

    return restoredProject;
  }

  private async findProjectOrFail(
    workspaceId: string,
    projectId: string,
  ): Promise<Project> {
    const project = await this.projectsRepository.findById(
      workspaceId,
      projectId,
    );

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    return project;
  }

  private assertCanManageProjects(role: WorkspaceRole): void {
    const allowedRoles: readonly WorkspaceRole[] = ['owner', 'admin'];

    if (!allowedRoles.includes(role)) {
      throw new ForbiddenException(
        'Only workspace owners and administrators can manage projects',
      );
    }
  }

  private normalizeKey(value: string): string {
    return value.trim().toUpperCase();
  }

  private normalizeDescription(value?: string): string | null {
    const normalizedValue = value?.trim();

    return normalizedValue ? normalizedValue : null;
  }

  private hasPostgresErrorCode(error: unknown, expectedCode: string): boolean {
    let currentError: unknown = error;

    for (let depth = 0; depth < 5; depth += 1) {
      if (typeof currentError !== 'object' || currentError === null) {
        return false;
      }

      const errorRecord = currentError as Record<string, unknown>;

      if (errorRecord.code === expectedCode) {
        return true;
      }

      currentError = errorRecord.cause;
    }

    return false;
  }
}
