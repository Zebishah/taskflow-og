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

type DependencyStatus = 'connected' | 'disconnected';

interface HealthResponse {
  status: 'ok At All' | 'error';
  service: 'taskflow-api';
  database: DependencyStatus;
  timestamp: string;
}

interface LiveResponse {
  status: 'ok';
  service: 'taskflow-api';
  timestamp: string;
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  /*
   * Lightweight keep-alive for cron (e.g. cron-job.org).
   * Does not touch Postgres/Redis — cheap and fast so Render free
   * tier does not sleep from idle.
   *
   * Cron URL: https://YOUR-API.onrender.com/api/v1/health/live
   */
  @Get('live')
  public live(): LiveResponse {
    return {
      status: 'ok',
      service: 'taskflow-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get()
  public async check(): Promise<HealthResponse> {
    /*
     * Render (and other hosts) call this path repeatedly to keep the
     * service marked healthy. Do NOT ping Upstash here — that would
     * burn free-tier Redis commands every few seconds with zero users.
     * Cache health is not required for liveness.
     */
    let databaseStatus: DependencyStatus = 'connected';

    try {
      await this.database.execute(sql`SELECT 1`);
    } catch (reason: unknown) {
      databaseStatus = 'disconnected';
      this.logFailure('Database', reason);
    }

    const response: HealthResponse = {
      status: databaseStatus === 'connected' ? 'ok At All' : 'error',
      service: 'taskflow-api',
      database: databaseStatus,
      timestamp: new Date().toISOString(),
    };

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
