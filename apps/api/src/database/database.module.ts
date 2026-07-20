import {
  Global,
  Inject,
  Injectable,
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
  public constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {}

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
          max: 10,
          idleTimeoutMillis: 30_000,
          connectionTimeoutMillis: 20_000,
        });
      },
    },
    {
      provide: DATABASE,
      inject: [DATABASE_POOL],
      useFactory: (pool: Pool): Database => {
        return drizzle(pool, {
          schema,
        });
      },
    },
    DatabaseLifecycleService,
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
