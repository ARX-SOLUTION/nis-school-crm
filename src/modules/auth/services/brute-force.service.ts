import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../common/redis/redis.constants';

const KEY_PREFIX = 'auth:bf';

@Injectable()
export class BruteForceService {
  private readonly windowSeconds: number;
  private readonly maxAttempts: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.windowSeconds = config.get<number>('AUTH_THROTTLE_TTL') ?? 900;
    this.maxAttempts = config.get<number>('AUTH_THROTTLE_LIMIT') ?? 5;
  }

  /** Returns true if either the email or the IP is currently locked out. */
  async isLocked(email: string, ip: string): Promise<boolean> {
    const [emailCount, ipCount] = await Promise.all([
      this.getCount(this.emailKey(email)),
      this.getCount(this.ipKey(ip)),
    ]);
    return emailCount >= this.maxAttempts || ipCount >= this.maxAttempts;
  }

  /** Increments both counters atomically; the first hit on a key sets the TTL. */
  async recordFailure(email: string, ip: string): Promise<void> {
    await Promise.all([this.bumpKey(this.emailKey(email)), this.bumpKey(this.ipKey(ip))]);
  }

  /** Successful login clears the failure counters. */
  async clear(email: string, ip: string): Promise<void> {
    await this.redis.del(this.emailKey(email), this.ipKey(ip));
  }

  /**
   * Atomic counter-with-TTL: SET NX seeds the key with TTL only if absent,
   * then INCR brings it to the right value. Avoids the INCR-then-EXPIRE TOCTOU
   * where a crash between the two calls could leave a key without expiry.
   */
  private async bumpKey(key: string): Promise<void> {
    await this.redis.set(key, '0', 'EX', this.windowSeconds, 'NX');
    await this.redis.incr(key);
  }

  private async getCount(key: string): Promise<number> {
    const raw = await this.redis.get(key);
    return raw ? parseInt(raw, 10) : 0;
  }

  private emailKey(email: string): string {
    return `${KEY_PREFIX}:email:${email.toLowerCase()}`;
  }

  private ipKey(ip: string): string {
    return `${KEY_PREFIX}:ip:${ip}`;
  }
}
