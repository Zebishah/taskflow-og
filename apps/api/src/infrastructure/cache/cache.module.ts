import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { CACHE_REDIS } from './cache.constants';
import { CacheService } from './cache.service';

@Module({
  providers: [
    {
      provide: CACHE_REDIS,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Redis(redisUrl, {
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
          connectTimeout: 5_000,
          retryStrategy: (attempt) => {
            if (attempt > 3) {
              return null;
            }

            return Math.min(attempt * 200, 1_000);
          },
        });
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
