import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { S3_CLIENT } from './storage.constants';

export interface PresignedPostUpload {
  uploadUrl: string;
  fields: Record<string, string>;
}

export interface S3ObjectInformation {
  contentLength: number;
  contentType: string;
  metadata: Record<string, string>;
}

@Injectable()
export class S3StorageService {
  private readonly bucket: string;
  private readonly presignedUrlTtlSeconds: number;

  public constructor(
    @Inject(S3_CLIENT)
    private readonly client: S3Client,
    configService: ConfigService,
  ) {
    this.bucket = configService.getOrThrow<string>('S3_TASK_IMAGES_BUCKET');

    this.presignedUrlTtlSeconds = configService.getOrThrow<number>(
      'S3_PRESIGNED_URL_TTL_SECONDS',
    );
  }

  public async createPresignedPost(
    objectKey: string,
    contentType: string,
    maximumBytes: number,
    metadata: Record<string, string>,
  ): Promise<PresignedPostUpload> {
    const metadataFields = Object.fromEntries(
      Object.entries(metadata).map(([name, value]) => [
        `x-amz-meta-${name}`,
        value,
      ]),
    );

    const result = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: objectKey,
      Expires: this.presignedUrlTtlSeconds,

      Fields: {
        'Content-Type': contentType,
        ...metadataFields,
      },

      Conditions: [
        ['content-length-range', 1, maximumBytes],
        ['eq', '$Content-Type', contentType],

        ...Object.entries(metadataFields).map(([name, value]) => ({
          [name]: value,
        })),
      ],
    });

    return {
      uploadUrl: result.url,
      fields: result.fields,
    };
  }

  public async findObject(
    objectKey: string,
  ): Promise<S3ObjectInformation | null> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: objectKey,
        }),
      );

      if (
        result.ContentLength === undefined ||
        result.ContentType === undefined
      ) {
        return null;
      }

      return {
        contentLength: result.ContentLength,
        contentType: result.ContentType,
        metadata: result.Metadata ?? {},
      };
    } catch (error: unknown) {
      if (
        error instanceof S3ServiceException &&
        error.$metadata.httpStatusCode === 404
      ) {
        return null;
      }

      throw error;
    }
  }

  public async promoteObject(
    pendingObjectKey: string,
    permanentObjectKey: string,
  ): Promise<void> {
    const encodedSourceKey = pendingObjectKey
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        Key: permanentObjectKey,
        CopySource: `${this.bucket}/${encodedSourceKey}`,
        MetadataDirective: 'COPY',
      }),
    );
  }

  public async createDownloadUrl(objectKey: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
      {
        expiresIn: this.presignedUrlTtlSeconds,
      },
    );
  }

  public async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: objectKey,
      }),
    );
  }
}
