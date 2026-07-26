import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { DATABASE } from '../../database/database.constants';
import type { Database } from '../../database/database.types';
import { tasks, type Task } from '../../database/schema';

export interface SaveTaskImageInput {
  imageKey: string;
  imageOriginalName: string;
  imageContentType: string;
  imageSizeBytes: number;
}

@Injectable()
export class TaskImagesRepository {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  public async findTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task | null> {
    const [task] = await this.database
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .limit(1);

    return task ?? null;
  }

  public async saveImage(
    workspaceId: string,
    projectId: string,
    taskId: string,
    input: SaveTaskImageInput,
  ): Promise<Task | null> {
    const [task] = await this.database
      .update(tasks)
      .set({
        imageKey: input.imageKey,
        imageOriginalName: input.imageOriginalName,
        imageContentType: input.imageContentType,
        imageSizeBytes: input.imageSizeBytes,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .returning();

    return task ?? null;
  }

  public async clearImage(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task | null> {
    const [task] = await this.database
      .update(tasks)
      .set({
        imageKey: null,
        imageOriginalName: null,
        imageContentType: null,
        imageSizeBytes: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.projectId, projectId),
          eq(tasks.id, taskId),
        ),
      )
      .returning();

    return task ?? null;
  }
}
