import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';
import { RedisHealthService } from './redis-health.service';

type DependencyStatus = 'connected' | 'disconnected';

interface HealthResponse {
  status: 'ok At All' | 'error';
  service: 'taskflow-api';
  database: DependencyStatus;
  redis: DependencyStatus;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,

    private readonly redisHealthService: RedisHealthService,
  ) {}

  @Get()
  public async check(): Promise<HealthResponse> {
    const [databaseResult, redisResult] = await Promise.allSettled([
      this.database.execute(sql`SELECT 1`),
      this.redisHealthService.ping(),
    ]);

    const response: HealthResponse = {
      status:
        databaseResult.status === 'fulfilled' &&
        redisResult.status === 'fulfilled'
          ? 'ok At All'
          : 'error',

      service: 'taskflow-api',

      database:
        databaseResult.status === 'fulfilled' ? 'connected' : 'disconnected',

      redis: redisResult.status === 'fulfilled' ? 'connected' : 'disconnected',

      timestamp: new Date().toISOString(),
    };

    if (databaseResult.status === 'rejected') {
      this.logFailure('Database', databaseResult.reason);
    }

    if (redisResult.status === 'rejected') {
      this.logFailure('Redis', redisResult.reason);
    }

    if (response.status === 'error') {
      throw new ServiceUnavailableException(response);
    }

    return response;
  }

  private logFailure(dependency: string, reason: unknown): void {
    const message =
      reason instanceof Error
        ? (reason.stack ?? reason.message)
        : String(reason);

    this.logger.error(`${dependency} health check failed: ${message}`);
  }
}
