import { Logger, ServiceUnavailableException } from '@nestjs/common';

import type { Database } from '../database/database.types';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  let databaseExecute: jest.MockedFunction<
    (query: unknown) => Promise<unknown>
  >;

  beforeEach(() => {
    databaseExecute = jest.fn();

    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const database = {
      execute: databaseExecute,
    } as unknown as Database;

    controller = new HealthController(database);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns ok when PostgreSQL is connected', async () => {
    databaseExecute.mockResolvedValue(undefined);

    const result = await controller.check();

    expect(result).toMatchObject({
      status: 'ok At All',
      service: 'taskflow-api',
      database: 'connected',
    });
    expect(typeof result.timestamp).toBe('string');
    expect(databaseExecute).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when PostgreSQL is disconnected', async () => {
    databaseExecute.mockRejectedValue(new Error('PostgreSQL unavailable'));

    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('identifies database as disconnected in the error response', async () => {
    databaseExecute.mockRejectedValue(new Error('PostgreSQL unavailable'));

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
        database: 'disconnected',
      });
    }
  });
});
