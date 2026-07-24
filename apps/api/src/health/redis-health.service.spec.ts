import type Redis from 'ioredis';

import { RedisHealthService } from './redis-health.service';

describe('RedisHealthService', () => {
  let ping: jest.MockedFunction<() => Promise<string>>;
  let quit: jest.MockedFunction<() => Promise<'OK'>>;
  let disconnect: jest.MockedFunction<() => void>;

  function createService(status: Redis['status']): RedisHealthService {
    const redis = {
      status,
      ping,
      quit,
      disconnect,
    } as unknown as Redis;

    return new RedisHealthService(redis);
  }

  beforeEach(() => {
    ping = jest.fn();
    quit = jest.fn();
    disconnect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('succeeds when Redis responds with PONG', async () => {
    ping.mockResolvedValue('PONG');

    const service = createService('ready');

    await expect(service.ping()).resolves.toBeUndefined();

    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('fails when Redis returns an unexpected response', async () => {
    ping.mockResolvedValue('UNEXPECTED');

    const service = createService('ready');

    await expect(service.ping()).rejects.toThrow(
      'Unexpected Redis health response',
    );
  });

  it('sends QUIT when Redis is connected during shutdown', async () => {
    quit.mockResolvedValue('OK');

    const service = createService('ready');

    await service.onApplicationShutdown();

    expect(quit).toHaveBeenCalledTimes(1);
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('disconnects locally when Redis is not ready', async () => {
    const service = createService('end');

    await service.onApplicationShutdown();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(quit).not.toHaveBeenCalled();
  });
});
