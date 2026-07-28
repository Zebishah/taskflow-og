import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run migrations');
  }

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 20_000,
  });

  try {
    const database = drizzle(pool);

    console.log('Starting TaskFlow database migrations...');

    await migrate(database, {
      migrationsFolder: 'drizzle',
    });

    console.log('TaskFlow database migrations completed successfully.');
  } finally {
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error('TaskFlow database migration failed:', error);
  process.exitCode = 1;
});
