import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import { projectColumns, projects, type Project } from '../../database/schema';

import { DEFAULT_PROJECT_COLUMNS } from './project-columns.constants';
interface CreateProjectInput {
  workspaceId: string;
  createdByUserId: string;
  name: string;
  key: string;
  description: string | null;
}

interface UpdateProjectInput {
  name?: string;
  key?: string;
  description?: string | null;
}

@Injectable()
export class ProjectsRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async create(input: CreateProjectInput): Promise<Project> {
    return this.database.transaction(async (transaction) => {
      const [project] = await transaction
        .insert(projects)
        .values({
          workspaceId: input.workspaceId,
          createdByUserId: input.createdByUserId,
          name: input.name,
          key: input.key,
          description: input.description,
        })
        .returning();

      if (!project) {
        throw new Error('Project creation returned no record');
      }

      await transaction.insert(projectColumns).values(
        DEFAULT_PROJECT_COLUMNS.map((column) => ({
          projectId: project.id,
          name: column.name,
          color: column.color,
          kind: column.kind,
          position: column.position,
        })),
      );

      return project;
    });
  }

  public async findAll(workspaceId: string): Promise<Project[]> {
    return this.database
      .select()
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
      .orderBy(asc(projects.name), asc(projects.createdAt));
  }

  public async findById(
    workspaceId: string,
    projectId: string,
  ): Promise<Project | null> {
    const [project] = await this.database
      .select()
      .from(projects)
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId)),
      )
      .limit(1);

    return project ?? null;
  }

  public async findByKey(
    workspaceId: string,
    key: string,
  ): Promise<Project | null> {
    const [project] = await this.database
      .select()
      .from(projects)
      .where(and(eq(projects.workspaceId, workspaceId), eq(projects.key, key)))
      .limit(1);

    return project ?? null;
  }

  public async update(
    workspaceId: string,
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<Project | null> {
    const [project] = await this.database
      .update(projects)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(eq(projects.workspaceId, workspaceId), eq(projects.id, projectId)),
      )
      .returning();

    return project ?? null;
  }

  public async archive(
    workspaceId: string,
    projectId: string,
  ): Promise<Project | null> {
    const now = new Date();

    const [project] = await this.database
      .update(projects)
      .set({
        archivedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.id, projectId),
          isNull(projects.archivedAt),
        ),
      )
      .returning();

    return project ?? null;
  }

  public async restore(
    workspaceId: string,
    projectId: string,
  ): Promise<Project | null> {
    const [project] = await this.database
      .update(projects)
      .set({
        archivedAt: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.workspaceId, workspaceId),
          eq(projects.id, projectId),
          isNotNull(projects.archivedAt),
        ),
      )
      .returning();

    return project ?? null;
  }
}
