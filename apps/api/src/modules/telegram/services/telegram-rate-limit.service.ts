import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/redis/redis.constants';

const WINDOW_SECONDS = 3600; // 1 hour
const MAX_PER_WINDOW = 20;

@Injectable()
export class TelegramRateLimitService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Atomically increment the per-chat counter. Returns true if the caller
   * is within the quota (and the bump succeeded), false when they've
   * already saturated the window.
   *
   * Atomicity: SET NX seeds the key with TTL only if absent, then INCR
   * bumps. A crash between the two is safe because the key already has
   * TTL from the seed write.
   */
  async checkAndBump(chatId: string): Promise<boolean> {
    const key = `tg:ratelimit:${chatId}`;
    await this.redis.set(key, '0', 'EX', WINDOW_SECONDS, 'NX');
    const count = await this.redis.incr(key);
    return count <= MAX_PER_WINDOW;
  }
}
