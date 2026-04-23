import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { randomBytes } from 'crypto';
import { REDIS_CLIENT } from '../../../common/redis/redis.constants';

const PREFIX = 'tg:link';
const TTL_SECONDS = 600; // 10 minutes

@Injectable()
export class LinkCodeService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Generate a 6-digit code bound to a userId. Stored in Redis with a 10m
   * TTL. Uses rejection-sampled randomBytes so the distribution is uniform
   * (plain `% 1_000_000` would bias low digits slightly).
   */
  async generate(userId: string): Promise<{ code: string; expiresInSeconds: number }> {
    const code = this.randomSixDigitCode();
    await this.redis.set(this.key(code), userId, 'EX', TTL_SECONDS);
    return { code, expiresInSeconds: TTL_SECONDS };
  }

  /**
   * Validate a code and atomically consume it. Returns the userId if the
   * code was valid and unused, null otherwise. Uses DEL+GET via a Lua-less
   * pattern (GETDEL, Redis 6.2+) so two concurrent /link commands can't
   * both bind.
   */
  async consume(code: string): Promise<string | null> {
    if (!/^\d{6}$/.test(code)) return null;
    const userId = await this.redis.getdel(this.key(code));
    return userId ?? null;
  }

  private key(code: string): string {
    return `${PREFIX}:${code}`;
  }

  private randomSixDigitCode(): string {
    const limit = Math.floor(0x100000000 / 1_000_000) * 1_000_000;
    while (true) {
      const v = randomBytes(4).readUInt32BE(0);
      if (v < limit) return (v % 1_000_000).toString().padStart(6, '0');
    }
  }
}
