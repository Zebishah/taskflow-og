import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, max, ne, SQL, sql } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import {
  projectColumns,
  tasks,
  type ProjectColumn,
  type ProjectColumnColor,
  type ProjectColumnKind,
} from '../../database/schema';

export interface CreateProjectColumnRepositoryInput {
  projectId: string;
  name: string;
  color: ProjectColumnColor;
  kind: ProjectColumnKind;
  position: number;
}

export interface UpdateProjectColumnRepositoryInput {
  name?: string;
  color?: ProjectColumnColor;
  kind?: ProjectColumnKind;
}
@Injectable()
export class ProjectColumnsRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async findAll(projectId: string): Promise<ProjectColumn[]> {
    return this.database
      .select()
      .from(projectColumns)
      .where(eq(projectColumns.projectId, projectId))
      .orderBy(asc(projectColumns.position), asc(projectColumns.createdAt));
  }

  public async findById(
    projectId: string,
    columnId: string,
  ): Promise<ProjectColumn | null> {
    const [column] = await this.database
      .select()
      .from(projectColumns)
      .where(
        and(
          eq(projectColumns.projectId, projectId),
          eq(projectColumns.id, columnId),
        ),
      )
      .limit(1);

    return column ?? null;
  }

  public async findByName(
    projectId: string,
    name: string,
    excludedColumnId?: string,
  ): Promise<ProjectColumn | null> {
    const conditions: SQL[] = [
      eq(projectColumns.projectId, projectId),

      sql`
      lower(${projectColumns.name})
      =
      lower(${name})
    `,
    ];

    if (excludedColumnId !== undefined) {
      conditions.push(ne(projectColumns.id, excludedColumnId));
    }

    const [column] = await this.database
      .select()
      .from(projectColumns)
      .where(and(...conditions))
      .limit(1);

    return column ?? null;
  }

  public async findDefault(projectId: string): Promise<ProjectColumn | null> {
    const [column] = await this.database
      .select()
      .from(projectColumns)
      .where(eq(projectColumns.projectId, projectId))
      .orderBy(
        sql`
          CASE ${projectColumns.kind}
            WHEN 'active' THEN 0
            WHEN 'backlog' THEN 1
            ELSE 2
          END
        `,
        asc(projectColumns.position),
      )
      .limit(1);

    return column ?? null;
  }

  public async countColumns(projectId: string): Promise<number> {
    const [result] = await this.database
      .select({
        value: count(),
      })
      .from(projectColumns)
      .where(eq(projectColumns.projectId, projectId));

    return result?.value ?? 0;
  }

  public async countDoneColumns(projectId: string): Promise<number> {
    const [result] = await this.database
      .select({
        value: count(),
      })
      .from(projectColumns)
      .where(
        and(
          eq(projectColumns.projectId, projectId),
          eq(projectColumns.kind, 'done'),
        ),
      );

    return result?.value ?? 0;
  }

  public async countTasks(
    projectId: string,
    columnId: string,
  ): Promise<number> {
    const [result] = await this.database
      .select({
        value: count(),
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.columnId, columnId)));

    return result?.value ?? 0;
  }

  public async findHighestPosition(projectId: string): Promise<number> {
    const [result] = await this.database
      .select({
        value: max(projectColumns.position),
      })
      .from(projectColumns)
      .where(eq(projectColumns.projectId, projectId));

    return result?.value ?? 0;
  }

  public async create(
    input: CreateProjectColumnRepositoryInput,
  ): Promise<ProjectColumn> {
    const [column] = await this.database
      .insert(projectColumns)
      .values(input)
      .returning();

    if (!column) {
      throw new Error('Column creation returned no record');
    }

    return column;
  }

  public async update(
    projectId: string,
    columnId: string,
    input: UpdateProjectColumnRepositoryInput,
  ): Promise<ProjectColumn | null> {
    return this.database.transaction(async (transaction) => {
      const [existingColumn] = await transaction
        .select()
        .from(projectColumns)
        .where(
          and(
            eq(projectColumns.projectId, projectId),
            eq(projectColumns.id, columnId),
          ),
        )
        .limit(1)
        .for('update');

      if (!existingColumn) {
        return null;
      }

      const [updatedColumn] = await transaction
        .update(projectColumns)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectColumns.projectId, projectId),
            eq(projectColumns.id, columnId),
          ),
        )
        .returning();

      if (!updatedColumn) {
        return null;
      }

      if (input.kind !== undefined && input.kind !== existingColumn.kind) {
        await transaction
          .update(tasks)
          .set({
            completedAt:
              input.kind === 'done'
                ? sql`
                    coalesce(
                      ${tasks.completedAt},
                      now()
                    )
                  `
                : null,

            updatedAt: new Date(),
          })
          .where(
            and(eq(tasks.projectId, projectId), eq(tasks.columnId, columnId)),
          );
      }

      return updatedColumn;
    });
  }

  public async reorder(
    projectId: string,
    columnIds: readonly string[],
  ): Promise<ProjectColumn[]> {
    if (columnIds.length === 0) {
      return [];
    }

    await this.database.transaction(async (transaction) => {
      /*
       * Lock the current project columns while their
       * positions are being updated.
       */
      const currentColumns = await transaction
        .select()
        .from(projectColumns)
        .where(eq(projectColumns.projectId, projectId))
        .orderBy(asc(projectColumns.position))
        .for('update');

      const highestPosition = Math.max(
        0,
        ...currentColumns.map((column) => column.position),
      );

      /*
       * First move every column to a temporary positive
       * position above all existing positions.
       *
       * We cannot use negative positions because the
       * schema has a position >= 0 check constraint.
       */
      for (const [index, columnId] of columnIds.entries()) {
        const temporaryPosition = highestPosition + (index + 1) * 1_000;

        const [updatedColumn] = await transaction
          .update(projectColumns)
          .set({
            position: temporaryPosition,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectColumns.projectId, projectId),
              eq(projectColumns.id, columnId),
            ),
          )
          .returning({
            id: projectColumns.id,
          });

        if (!updatedColumn) {
          throw new Error(
            `Project column ${columnId} was not found during reordering`,
          );
        }
      }

      /*
       * After all old positions are free, apply the
       * final normalized positions.
       */
      for (const [index, columnId] of columnIds.entries()) {
        const finalPosition = (index + 1) * 1_000;

        const [updatedColumn] = await transaction
          .update(projectColumns)
          .set({
            position: finalPosition,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(projectColumns.projectId, projectId),
              eq(projectColumns.id, columnId),
            ),
          )
          .returning({
            id: projectColumns.id,
          });

        if (!updatedColumn) {
          throw new Error(
            `Project column ${columnId} was not found during reordering`,
          );
        }
      }
    });

    return this.findAll(projectId);
  }

  public async deleteAndMoveTasks(
    projectId: string,
    columnId: string,
    destination: ProjectColumn | null,
  ): Promise<void> {
    await this.database.transaction(async (transaction) => {
      if (destination !== null) {
        if (destination.projectId !== projectId) {
          throw new Error('The destination column belongs to another project');
        }

        if (destination.id === columnId) {
          throw new Error(
            'The destination column must be different from the deleted column',
          );
        }

        await transaction
          .update(tasks)
          .set({
            columnId: destination.id,

            completedAt:
              destination.kind === 'done'
                ? sql`
                    coalesce(
                      ${tasks.completedAt},
                      now()
                    )
                  `
                : null,

            updatedAt: new Date(),
          })
          .where(
            and(eq(tasks.projectId, projectId), eq(tasks.columnId, columnId)),
          );
      }

      const [deletedColumn] = await transaction
        .delete(projectColumns)
        .where(
          and(
            eq(projectColumns.projectId, projectId),
            eq(projectColumns.id, columnId),
          ),
        )
        .returning({
          id: projectColumns.id,
        });

      if (!deletedColumn) {
        throw new Error('Project column was not found during deletion');
      }
    });
  }
}
