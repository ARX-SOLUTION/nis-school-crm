import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/redis/redis.constants';

/**
 * Per-IP sliding-window rate limiter for POST /auth/telegram.
 *
 * Limits: 10 attempts per 60 seconds per IP address.
 * Redis keys are prefixed tg-login:<ip> and expire after WINDOW_SECONDS.
 *
 * The atomic SET NX + INCR pattern (same as BruteForceService) avoids the
 * TOCTOU race where a crash between INCR and EXPIRE would leave a key without
 * an expiry, effectively creating an indefinite block.
 */
@Injectable()
export class TelegramLoginRateLimitService {
  private static readonly WINDOW_SECONDS = 60;
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly KEY_PREFIX = 'tg-login';

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Registers one attempt for the given IP. Throws HTTP 429 when the
   * per-IP limit is exceeded within the current window.
   */
  async registerAttempt(ip: string): Promise<void> {
    const key = this.buildKey(ip);

    // SET key 0 EX window NX — seeds the counter only if the key does not exist.
    await this.redis.set(key, '0', 'EX', TelegramLoginRateLimitService.WINDOW_SECONDS, 'NX');
    const count = await this.redis.incr(key);

    if (count > TelegramLoginRateLimitService.MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many Telegram login attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private buildKey(ip: string): string {
    return `${TelegramLoginRateLimitService.KEY_PREFIX}:${ip}`;
  }
}
