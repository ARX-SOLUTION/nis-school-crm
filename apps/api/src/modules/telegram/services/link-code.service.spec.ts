import Redis from 'ioredis';
import { LinkCodeService } from './link-code.service';

describe('LinkCodeService', () => {
  const build = () => {
    const store = new Map<string, string>();
    const redis = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      getdel: jest.fn(async (key: string) => {
        const v = store.get(key) ?? null;
        store.delete(key);
        return v;
      }),
    } as unknown as Redis;
    return { service: new LinkCodeService(redis), store, redis };
  };

  it('should_generate_a_six_digit_code', async () => {
    const { service } = build();
    const result = await service.generate('u-1');
    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.expiresInSeconds).toBe(600);
  });

  it('should_persist_code_with_10_minute_ttl', async () => {
    const { service, redis } = build();
    await service.generate('u-1');
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^tg:link:\d{6}$/),
      'u-1',
      'EX',
      600,
    );
  });

  it('should_consume_a_valid_code_once_and_return_user_id', async () => {
    const { service } = build();
    const { code } = await service.generate('u-1');
    const first = await service.consume(code);
    const second = await service.consume(code);
    expect(first).toBe('u-1');
    expect(second).toBeNull();
  });

  it('should_reject_malformed_codes_without_redis_roundtrip', async () => {
    const { service, redis } = build();
    const result = await service.consume('abc123');
    expect(result).toBeNull();
    expect(redis.getdel).not.toHaveBeenCalled();
  });

  it('should_return_null_for_unknown_code', async () => {
    const { service } = build();
    expect(await service.consume('999999')).toBeNull();
  });

  it('should_produce_distinct_codes_across_calls', async () => {
    const { service } = build();
    const set = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const r = await service.generate('u-1');
      set.add(r.code);
    }
    // Collisions in 20 random 6-digit codes are astronomically unlikely.
    expect(set.size).toBe(20);
  });
});
