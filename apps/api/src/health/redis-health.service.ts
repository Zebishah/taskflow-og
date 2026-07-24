import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_HEALTH_CLIENT } from './health.constants';

@Injectable()
export class RedisHealthService implements OnApplicationShutdown {
  public constructor(
    @Inject(REDIS_HEALTH_CLIENT)
    private readonly redis: Redis,
  ) {}

  public async ping(): Promise<void> {
    const response = await this.redis.ping();

    if (response !== 'PONG') {
      throw new Error('Unexpected Redis health response: ' + String(response));
    }
  }

  public async onApplicationShutdown(): Promise<void> {
    if (this.redis.status === 'ready') {
      await this.redis.quit();
      return;
    }

    this.redis.disconnect();
  }
}
