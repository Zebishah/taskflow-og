import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { S3StorageService } from './s3-storage.service';
import { S3_CLIENT } from './storage.constants';

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],

      useFactory: (configService: ConfigService): S3Client => {
        return new S3Client({
          region: configService.getOrThrow<string>('AWS_REGION'),
        });
      },
    },

    S3StorageService,
  ],

  exports: [S3StorageService],
})
export class S3StorageModule {}
