import { Logger, ServiceUnavailableException } from '@nestjs/common';

import type { Database } from '../database/database.types';
import { HealthController } from './health.controller';
import { RedisHealthService } from './redis-health.service';

describe('HealthController', () => {
  let controller: HealthController;

  let databaseExecute: jest.MockedFunction<
    (query: unknown) => Promise<unknown>
  >;

  let redisPing: jest.MockedFunction<() => Promise<void>>;

  beforeEach(() => {
    databaseExecute = jest.fn();
    redisPing = jest.fn();

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const database = {
      execute: databaseExecute,
    } as unknown as Database;

    const redisHealthService = {
      ping: redisPing,
    } as unknown as RedisHealthService;

    controller = new HealthController(database, redisHealthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns ok when PostgreSQL and Redis are connected', async () => {
    databaseExecute.mockResolvedValue(undefined);
    redisPing.mockResolvedValue(undefined);

    const result = await controller.check();

    expect(result).toMatchObject({
      status: 'ok At All',
      service: 'taskflow-api',
      database: 'connected',
      redis: 'connected',
    });
    expect(typeof result.timestamp).toBe('string');

    expect(databaseExecute).toHaveBeenCalledTimes(1);
    expect(redisPing).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when PostgreSQL is disconnected', async () => {
    databaseExecute.mockRejectedValue(new Error('PostgreSQL unavailable'));

    redisPing.mockResolvedValue(undefined);

    await expect(controller.check()).rejects.toMatchObject({
      status: 503,
    });
  });

  it('returns 503 when Redis is disconnected', async () => {
    databaseExecute.mockResolvedValue(undefined);

    redisPing.mockRejectedValue(new Error('Redis unavailable'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('checks both dependencies when both fail', async () => {
    databaseExecute.mockRejectedValue(new Error('PostgreSQL unavailable'));

    redisPing.mockRejectedValue(new Error('Redis unavailable'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );

    expect(databaseExecute).toHaveBeenCalledTimes(1);
    expect(redisPing).toHaveBeenCalledTimes(1);
  });

  it('identifies Redis as disconnected in the error response', async () => {
    databaseExecute.mockResolvedValue(undefined);

    redisPing.mockRejectedValue(new Error('Redis unavailable'));

    expect.assertions(2);

    try {
      await controller.check();
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);

      if (!(error instanceof ServiceUnavailableException)) {
        throw error;
      }

      expect(error.getResponse()).toMatchObject({
        status: 'error',
        service: 'taskflow-api',
        database: 'connected',
        redis: 'disconnected',
      });
    }
  });
});
