import { CacheService } from '../infrastructure/cache/cache.service';
import { RedisHealthService } from './redis-health.service';

describe('RedisHealthService', () => {
  it('succeeds when Upstash responds with PONG', async () => {
    const ping = jest.fn().mockResolvedValue('PONG');
    const service = new RedisHealthService({
      ping,
    } as unknown as CacheService);

    await expect(service.ping()).resolves.toBe('PONG');
    expect(ping).toHaveBeenCalled();
  });

  it('propagates ping failures', async () => {
    const ping = jest.fn().mockRejectedValue(new Error('Upstash unavailable'));
    const service = new RedisHealthService({
      ping,
    } as unknown as CacheService);

    await expect(service.ping()).rejects.toThrow('Upstash unavailable');
  });
});
