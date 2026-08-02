import { Injectable } from '@nestjs/common';

import { CacheService } from '../infrastructure/cache/cache.service';

@Injectable()
export class RedisHealthService {
  public constructor(private readonly cacheService: CacheService) {}

  public async ping(): Promise<string> {
    return this.cacheService.ping();
  }
}
