import type { ConnectionOptions } from 'bullmq';

export function createRedisConnectionOptions(
  redisUrl: string,
  workerConnection: boolean,
): ConnectionOptions {
  const parsedUrl = new URL(redisUrl);

  if (parsedUrl.protocol !== 'redis:' && parsedUrl.protocol !== 'rediss:') {
    throw new Error('REDIS_URL must use redis:// or rediss://');
  }

  const databasePath = parsedUrl.pathname.replace(/^\//, '');

  const database =
    databasePath.length > 0 ? Number.parseInt(databasePath, 10) : 0;

  if (!Number.isInteger(database) || database < 0) {
    throw new Error('REDIS_URL contains an invalid database number');
  }

  return {
    host: parsedUrl.hostname,

    port:
      parsedUrl.port.length > 0 ? Number.parseInt(parsedUrl.port, 10) : 6379,

    username:
      parsedUrl.username.length > 0
        ? decodeURIComponent(parsedUrl.username)
        : undefined,

    password:
      parsedUrl.password.length > 0
        ? decodeURIComponent(parsedUrl.password)
        : undefined,

    db: database,

    tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,

    /*
     * BullMQ workers require null because they must
     * continue waiting while Redis temporarily reconnects.
     *
     * API producers should fail quickly instead of
     * keeping an HTTP request open indefinitely.
     */
    maxRetriesPerRequest: workerConnection ? null : 1,
  };
}
