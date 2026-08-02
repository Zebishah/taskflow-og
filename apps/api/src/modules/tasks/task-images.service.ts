import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import type { Task } from '../../database/schema';
import { CacheKeys } from '../../infrastructure/cache/cache.keys';
import { CacheService } from '../../infrastructure/cache/cache.service';
import { S3StorageService } from '../../infrastructure/storage/s3-storage.service';
import {
  allowedTaskImageContentTypes,
  taskImageExtensions,
  type TaskImageContentType,
} from '../../infrastructure/storage/storage.constants';
import type { WorkspaceMembershipContext } from '../workspaces/workspaces.types';
import type { ConfirmTaskImageUploadDto } from './dto/confirm-task-image-upload.dto';
import type { CreateTaskImageUploadDto } from './dto/create-task-image-upload.dto';
import { TaskImagesRepository } from './task-images.repository';
import type {
  TaskImageResponse,
  TaskImageUploadIntent,
} from './task-images.types';

@Injectable()
export class TaskImagesService {
  private readonly logger = new Logger(TaskImagesService.name);
  private readonly maximumBytes: number;
  private readonly presignedUrlTtlSeconds: number;

  public constructor(
    private readonly repository: TaskImagesRepository,
    private readonly storage: S3StorageService,
    private readonly cacheService: CacheService,
    configService: ConfigService,
  ) {
    this.maximumBytes = configService.getOrThrow<number>(
      'TASK_IMAGE_MAX_BYTES',
    );

    this.presignedUrlTtlSeconds = configService.getOrThrow<number>(
      'S3_PRESIGNED_URL_TTL_SECONDS',
    );
  }

  public async createUploadIntent(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
    dto: CreateTaskImageUploadDto,
  ): Promise<TaskImageUploadIntent> {
    const task = await this.findTaskOrFail(
      context.workspace.id,
      projectId,
      taskId,
    );

    if (dto.sizeBytes > this.maximumBytes) {
      throw new BadRequestException(
        `Task images must not exceed ${this.maximumBytes} bytes`,
      );
    }

    const contentType = dto.contentType;
    const extension = taskImageExtensions[contentType];
    const originalName = this.normalizeOriginalName(dto.fileName, extension);

    const objectKey =
      `pending/task-images/${context.workspace.id}` +
      `/${projectId}/${task.id}/${randomUUID()}.${extension}`;

    const upload = await this.storage.createPresignedPost(
      objectKey,
      contentType,
      this.maximumBytes,
      {
        'workspace-id': context.workspace.id,
        'project-id': projectId,
        'task-id': task.id,
        'original-name': encodeURIComponent(originalName),
      },
    );

    return {
      objectKey,
      uploadUrl: upload.uploadUrl,
      fields: upload.fields,
      expiresInSeconds: this.presignedUrlTtlSeconds,
    };
  }

  public async confirmUpload(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
    dto: ConfirmTaskImageUploadDto,
  ): Promise<TaskImageResponse> {
    const workspaceId = context.workspace.id;

    const task = await this.findTaskOrFail(workspaceId, projectId, taskId);

    const requiredPrefix = `pending/task-images/${workspaceId}/${projectId}/${taskId}/`;

    if (!dto.objectKey.startsWith(requiredPrefix)) {
      throw new BadRequestException('The uploaded object does not belong here');
    }

    const object = await this.storage.findObject(dto.objectKey);

    if (!object) {
      throw new BadRequestException(
        'The uploaded image was not found in storage',
      );
    }

    if (object.contentLength < 1 || object.contentLength > this.maximumBytes) {
      await this.deleteObjectSafely(dto.objectKey);

      throw new BadRequestException('The uploaded image has an invalid size');
    }

    if (!this.isAllowedContentType(object.contentType)) {
      await this.deleteObjectSafely(dto.objectKey);

      throw new BadRequestException('The uploaded image type is not allowed');
    }

    if (
      object.metadata['workspace-id'] !== workspaceId ||
      object.metadata['project-id'] !== projectId ||
      object.metadata['task-id'] !== taskId
    ) {
      await this.deleteObjectSafely(dto.objectKey);

      throw new BadRequestException('The uploaded image metadata is invalid');
    }

    const encodedOriginalName = object.metadata['original-name'];

    if (!encodedOriginalName) {
      await this.deleteObjectSafely(dto.objectKey);

      throw new BadRequestException(
        'The uploaded image filename is unavailable',
      );
    }

    const originalName = this.decodeOriginalName(encodedOriginalName);

    const permanentObjectKey = dto.objectKey.replace(
      'pending/task-images/',
      'task-images/',
    );

    await this.storage.promoteObject(dto.objectKey, permanentObjectKey);

    let updatedTask: Task | null = null;

    try {
      updatedTask = await this.repository.saveImage(
        workspaceId,
        projectId,
        taskId,
        {
          imageKey: permanentObjectKey,
          imageOriginalName: originalName,
          imageContentType: object.contentType,
          imageSizeBytes: object.contentLength,
        },
      );
    } catch (error: unknown) {
      await this.deleteObjectSafely(permanentObjectKey);
      throw error;
    }

    if (!updatedTask) {
      await this.deleteObjectSafely(permanentObjectKey);

      throw new NotFoundException('Task was not found');
    }

    await this.deleteObjectSafely(dto.objectKey);

    if (task.imageKey !== null && task.imageKey !== permanentObjectKey) {
      await this.deleteObjectSafely(task.imageKey);
    }

    await this.cacheService.del(
      CacheKeys.projectTasks(workspaceId, projectId),
    );

    return this.createResponse(updatedTask);
  }

  public async findImage(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
  ): Promise<TaskImageResponse> {
    const task = await this.findTaskOrFail(
      context.workspace.id,
      projectId,
      taskId,
    );

    return this.createResponse(task);
  }

  public async removeImage(
    context: WorkspaceMembershipContext,
    projectId: string,
    taskId: string,
  ): Promise<void> {
    const task = await this.findTaskOrFail(
      context.workspace.id,
      projectId,
      taskId,
    );

    if (task.imageKey === null) {
      return;
    }

    const updatedTask = await this.repository.clearImage(
      context.workspace.id,
      projectId,
      taskId,
    );

    if (!updatedTask) {
      throw new NotFoundException('Task was not found');
    }

    await this.deleteObjectSafely(task.imageKey);

    await this.cacheService.del(
      CacheKeys.projectTasks(context.workspace.id, projectId),
    );
  }

  public async deleteObjectSafely(objectKey: string | null): Promise<void> {
    if (objectKey === null) {
      return;
    }

    try {
      await this.storage.deleteObject(objectKey);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? (error.stack ?? error.message) : String(error);

      this.logger.error(
        `Failed to delete S3 task image object "${objectKey}"`,
        message,
      );
    }
  }

  private async findTaskOrFail(
    workspaceId: string,
    projectId: string,
    taskId: string,
  ): Promise<Task> {
    const task = await this.repository.findTask(workspaceId, projectId, taskId);

    if (!task) {
      throw new NotFoundException('Task was not found');
    }

    return task;
  }

  private async createResponse(task: Task): Promise<TaskImageResponse> {
    if (
      task.imageKey === null ||
      task.imageOriginalName === null ||
      task.imageContentType === null ||
      task.imageSizeBytes === null
    ) {
      throw new NotFoundException('This task does not have an image');
    }

    return {
      originalName: task.imageOriginalName,
      contentType: task.imageContentType,
      sizeBytes: task.imageSizeBytes,
      downloadUrl: await this.storage.createDownloadUrl(task.imageKey),
    };
  }

  private isAllowedContentType(value: string): value is TaskImageContentType {
    return allowedTaskImageContentTypes.some(
      (contentType) => contentType === value,
    );
  }

  private normalizeOriginalName(value: string, extension: string): string {
    const fileName = value
      .replace(/^.*[\\/]/, '')
      .replace(/[^a-zA-Z0-9._ ()-]/g, '_')
      .trim();

    return (fileName || `task-image.${extension}`).slice(0, 255);
  }

  private decodeOriginalName(value: string): string {
    try {
      return decodeURIComponent(value).slice(0, 255);
    } catch {
      throw new BadRequestException('The uploaded image filename is invalid');
    }
  }
}
