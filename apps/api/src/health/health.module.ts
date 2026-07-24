import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { HealthController } from './health.controller';
import { REDIS_HEALTH_CLIENT } from './health.constants';
import { RedisHealthService } from './redis-health.service';

@Module({
  controllers: [HealthController],

  providers: [
    {
      provide: REDIS_HEALTH_CLIENT,
      inject: [ConfigService],

      useFactory: (configService: ConfigService): Redis => {
        const redisUrl = configService.getOrThrow<string>('REDIS_URL');

        return new Redis(redisUrl, {
          lazyConnect: true,
          connectTimeout: 5_000,
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
        });
      },
    },

    RedisHealthService,
  ],
})
export class HealthModule {}
