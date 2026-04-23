import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const pong = await this.redis.ping();
      const isUp = pong === 'PONG';
      const result = this.getStatus(key, isUp, { response: pong });
      if (!isUp) {
        throw new HealthCheckError('Redis ping failed', result);
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { error: message }),
      );
    }
  }
}
