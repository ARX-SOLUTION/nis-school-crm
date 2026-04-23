import Redis from 'ioredis';
import { TelegramRateLimitService } from './telegram-rate-limit.service';

describe('TelegramRateLimitService', () => {
  const build = () => {
    let counter = 0;
    const redis = {
      set: jest.fn().mockResolvedValue('OK'),
      incr: jest.fn(async () => ++counter),
    } as unknown as Redis;
    return {
      service: new TelegramRateLimitService(redis),
      redis,
      setCounter: (n: number) => {
        counter = n;
      },
    };
  };

  it('should_allow_first_20_calls_and_block_the_21st', async () => {
    const { service } = build();
    for (let i = 1; i <= 20; i++) {
      expect(await service.checkAndBump('chat-1')).toBe(true);
    }
    expect(await service.checkAndBump('chat-1')).toBe(false);
  });

  it('should_seed_key_with_nx_ex_on_first_hit', async () => {
    const { service, redis } = build();
    await service.checkAndBump('chat-1');
    expect(redis.set).toHaveBeenCalledWith('tg:ratelimit:chat-1', '0', 'EX', 3600, 'NX');
  });
});
