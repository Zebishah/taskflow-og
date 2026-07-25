import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  Project,
  ProjectColumn,
  WorkspaceRole,
} from '../../database/schema';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { CreateProjectColumnDto } from './dto/project-columns/create-project-column.dto';
import type { ReorderProjectColumnsDto } from './dto/project-columns/reorder-project-columns.dto';
import type { UpdateProjectColumnDto } from './dto/project-columns/update-project-column.dto';
import { ProjectColumnsRepository } from './project-columns.repository';
import { ProjectsRepository } from './projects.repository';

@Injectable()
export class ProjectColumnsService {
  public constructor(
    private readonly repository: ProjectColumnsRepository,
    private readonly projectsRepository: ProjectsRepository,
  ) {}

  public async findAll(
    context: WorkspaceMembershipContext,
    projectId: string,
  ): Promise<ProjectColumn[]> {
    await this.findProjectOrFail(context.workspace.id, projectId);

    return this.repository.findAll(projectId);
  }

  public async create(
    context: WorkspaceMembershipContext,
    projectId: string,
    dto: CreateProjectColumnDto,
  ): Promise<ProjectColumn> {
    this.assertCanManage(context.membership.role);

    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    const existingColumns = await this.repository.findAll(projectId);

    if (existingColumns.length >= 10) {
      throw new ConflictException('A project can contain at most 10 columns');
    }

    const normalizedName = dto.name.trim();

    const duplicate = await this.repository.findByName(
      projectId,
      normalizedName,
    );

    if (duplicate) {
      throw new ConflictException('A column with this name already exists');
    }

    const highestPosition =
      await this.repository.findHighestPosition(projectId);

    return this.repository.create({
      projectId,
      name: normalizedName,
      color: dto.color ?? 'slate',
      kind: dto.kind ?? 'active',
      position: highestPosition + 1_000,
    });
  }

  public async update(
    context: WorkspaceMembershipContext,
    projectId: string,
    columnId: string,
    dto: UpdateProjectColumnDto,
  ): Promise<ProjectColumn> {
    this.assertCanManage(context.membership.role);

    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    const column = await this.findColumnOrFail(projectId, columnId);

    if (dto.name !== undefined) {
      const duplicate = await this.repository.findByName(
        projectId,
        dto.name.trim(),
        columnId,
      );

      if (duplicate) {
        throw new ConflictException('A column with this name already exists');
      }
    }

    if (
      column.kind === 'done' &&
      dto.kind !== undefined &&
      dto.kind !== 'done'
    ) {
      const doneCount = await this.repository.countDoneColumns(projectId);

      if (doneCount <= 1) {
        throw new ConflictException(
          'Every project must have at least one completion column',
        );
      }
    }

    const updated = await this.repository.update(projectId, columnId, {
      name: dto.name?.trim(),
      color: dto.color,
      kind: dto.kind,
    });

    if (!updated) {
      throw new NotFoundException('Column was not found');
    }

    return updated;
  }

  public async reorder(
    context: WorkspaceMembershipContext,
    projectId: string,
    dto: ReorderProjectColumnsDto,
  ): Promise<ProjectColumn[]> {
    this.assertCanManage(context.membership.role);

    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    const existingColumns = await this.repository.findAll(projectId);

    const existingIds = new Set(existingColumns.map((column) => column.id));

    if (
      dto.columnIds.length !== existingColumns.length ||
      dto.columnIds.some((columnId) => !existingIds.has(columnId))
    ) {
      throw new ConflictException(
        'The reorder request must contain every project column exactly once',
      );
    }

    return this.repository.reorder(projectId, dto.columnIds);
  }

  public async remove(
    context: WorkspaceMembershipContext,
    projectId: string,
    columnId: string,
    destinationColumnId?: string,
  ): Promise<void> {
    this.assertCanManage(context.membership.role);

    const project = await this.findProjectOrFail(
      context.workspace.id,
      projectId,
    );

    this.assertProjectIsActive(project);

    const column = await this.findColumnOrFail(projectId, columnId);

    const columnCount = await this.repository.countColumns(projectId);

    if (columnCount <= 1) {
      throw new ConflictException('The final project column cannot be deleted');
    }

    if (column.kind === 'done') {
      const doneCount = await this.repository.countDoneColumns(projectId);

      if (doneCount <= 1) {
        throw new ConflictException(
          'The final completion column cannot be deleted',
        );
      }
    }

    const taskCount = await this.repository.countTasks(projectId, columnId);

    let destination: ProjectColumn | null = null;

    if (taskCount > 0) {
      if (!destinationColumnId) {
        throw new ConflictException(
          'Choose another column for the tasks before deleting this column',
        );
      }

      if (destinationColumnId === columnId) {
        throw new ConflictException(
          'The destination must be a different column',
        );
      }

      destination = await this.findColumnOrFail(projectId, destinationColumnId);
    }

    await this.repository.deleteAndMoveTasks(projectId, columnId, destination);
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

  private async findColumnOrFail(
    projectId: string,
    columnId: string,
  ): Promise<ProjectColumn> {
    const column = await this.repository.findById(projectId, columnId);

    if (!column) {
      throw new NotFoundException('Column was not found');
    }

    return column;
  }

  private assertCanManage(role: WorkspaceRole): void {
    if (role !== 'owner' && role !== 'admin') {
      throw new ForbiddenException(
        'Only workspace owners and administrators can manage project columns',
      );
    }
  }

  private assertProjectIsActive(project: Project): void {
    if (project.archivedAt) {
      throw new ConflictException(
        'Restore this project before changing its workflow',
      );
    }
  }
}
