import {
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DATABASE } from './database.constants';
import type { Database } from './database.types';
import * as schema from './schema';

const DATABASE_POOL = Symbol('DATABASE_POOL');

@Injectable()
class DatabaseLifecycleService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseLifecycleService.name);

  public constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {
    this.pool.on('error', (error: Error) => {
      this.logger.error('An idle database connection failed', error.stack);
    });
  }

  public async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],

      useFactory: (configService: ConfigService): Pool => {
        const connectionString =
          configService.getOrThrow<string>('DATABASE_URL');

        return new Pool({
          connectionString,
          max: 3,
          min: 0,
          idleTimeoutMillis: 10_000,
          connectionTimeoutMillis: 20_000,
          keepAlive: true,
          keepAliveInitialDelayMillis: 10_000,
          allowExitOnIdle: false,
        });
      },
    },

    {
      provide: DATABASE,
      inject: [DATABASE_POOL],

      useFactory: (pool: Pool): Database =>
        drizzle(pool, {
          schema,
        }),
    },

    DatabaseLifecycleService,
  ],

  exports: [DATABASE],
})
export class DatabaseModule {}
