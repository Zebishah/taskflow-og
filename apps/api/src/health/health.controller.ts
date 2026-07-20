import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants';
import type { Database } from '../database/database.types';

interface HealthResponse {
  status: 'ok';
  service: 'taskflow-api';
  database: 'connected';
  timestamp: string;
}

@Controller('health')
export class HealthController {
  public constructor(
    @Inject(DATABASE)
    private readonly database: Database,
  ) {}

  @Get()
  public async check(): Promise<HealthResponse> {
    try {
      await this.database.execute(sql`SELECT 1`);

      return {
        status: 'ok',
        service: 'taskflow-api',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      console.error('Database health check failed:', error);
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'taskflow-api',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
