import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BruteForceService } from './brute-force.service';

interface Built {
  service: BruteForceService;
  redis: jest.Mocked<Pick<Redis, 'set' | 'incr' | 'get' | 'del'>>;
}

const buildService = (): Built => {
  const redis = {
    set: jest.fn(),
    incr: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  } as unknown as jest.Mocked<Pick<Redis, 'set' | 'incr' | 'get' | 'del'>>;
  const config = {
    get: jest.fn((key: string) =>
      key === 'AUTH_THROTTLE_TTL' ? 900 : key === 'AUTH_THROTTLE_LIMIT' ? 5 : undefined,
    ),
  } as unknown as ConfigService;
  return { service: new BruteForceService(redis as unknown as Redis, config), redis };
};

describe('BruteForceService', () => {
  it('should_seed_with_set_nx_then_incr', async () => {
    const { service, redis } = buildService();
    await service.recordFailure('a@x.com', '1.2.3.4');
    expect(redis.set).toHaveBeenCalledWith('auth:bf:email:a@x.com', '0', 'EX', 900, 'NX');
    expect(redis.set).toHaveBeenCalledWith('auth:bf:ip:1.2.3.4', '0', 'EX', 900, 'NX');
    expect(redis.incr).toHaveBeenCalledTimes(2);
  });

  it('should_lockout_when_threshold_reached', async () => {
    const { service, redis } = buildService();
    redis.get.mockResolvedValueOnce('5').mockResolvedValueOnce('0');
    expect(await service.isLocked('a@x.com', '1.2.3.4')).toBe(true);
  });

  it('should_lockout_on_ip_alone', async () => {
    const { service, redis } = buildService();
    redis.get.mockResolvedValueOnce('0').mockResolvedValueOnce('5');
    expect(await service.isLocked('a@x.com', '1.2.3.4')).toBe(true);
  });

  it('should_not_lockout_below_threshold', async () => {
    const { service, redis } = buildService();
    redis.get.mockResolvedValue('3');
    expect(await service.isLocked('a@x.com', '1.2.3.4')).toBe(false);
  });

  it('should_clear_both_keys_on_success', async () => {
    const { service, redis } = buildService();
    await service.clear('a@x.com', '1.2.3.4');
    expect(redis.del).toHaveBeenCalledWith('auth:bf:email:a@x.com', 'auth:bf:ip:1.2.3.4');
  });

  it('should_lowercase_email_in_key', async () => {
    const { service, redis } = buildService();
    await service.clear('Admin@NIS.UZ', '1.2.3.4');
    expect(redis.del).toHaveBeenCalledWith('auth:bf:email:admin@nis.uz', 'auth:bf:ip:1.2.3.4');
  });
});
