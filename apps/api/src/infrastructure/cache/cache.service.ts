import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import type Redis from 'ioredis';

import { CACHE_REDIS } from './cache.constants';

@Injectable()
export class CacheService implements OnApplicationShutdown {
  private readonly logger = new Logger(CacheService.name);

  public constructor(
    @Inject(CACHE_REDIS)
    private readonly redis: Redis,
  ) {}

  public async ping(): Promise<string> {
    const response = await this.redis.ping();

    if (response !== 'PONG') {
      throw new Error(`Unexpected Redis ping response: ${String(response)}`);
    }

    return response;
  }

  public async getJson<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: unknown) {
      this.logFailure('get', key, error);

      return null;
    }
  }

  public async setJson(
    key: string,
    value: unknown,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error: unknown) {
      this.logFailure('set', key, error);
    }
  }

  public async del(...keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys.filter(Boolean))];

    if (uniqueKeys.length === 0) {
      return;
    }

    try {
      await this.redis.del(...uniqueKeys);
    } catch (error: unknown) {
      this.logFailure('del', uniqueKeys.join(','), error);
    }
  }

  public async getOrSetJson<T>(
    key: string,
    ttlSeconds: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.getJson<T>(key);

    if (cached !== null) {
      return cached;
    }

    const fresh = await loader();

    await this.setJson(key, fresh, ttlSeconds);

    return fresh;
  }

  public async onApplicationShutdown(): Promise<void> {
    if (this.redis.status === 'ready' || this.redis.status === 'connecting') {
      await this.redis.quit();
      return;
    }

    this.redis.disconnect();
  }

  private logFailure(operation: string, key: string, error: unknown): void {
    const message =
      error instanceof Error ? (error.stack ?? error.message) : String(error);

    this.logger.warn(`Cache ${operation} failed for ${key}: ${message}`);
  }
}
