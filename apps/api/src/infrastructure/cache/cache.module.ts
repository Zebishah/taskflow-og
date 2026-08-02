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
          maxRetriesPerRequest: 2,
          enableReadyCheck: true,
          lazyConnect: false,
        });
      },
    },
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
