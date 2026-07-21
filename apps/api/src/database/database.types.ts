import type { NeonDatabase } from 'drizzle-orm/neon-serverless';

import type * as schema from './schema';

export type Database = NeonDatabase<typeof schema>;
