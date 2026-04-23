import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedisHealthIndicator } from '../../common/redis/redis.health';
import { RabbitMqHealthIndicator } from './rabbitmq.health';

@ApiTags('health')
@Controller({ path: 'health', version: ['1'] })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly rabbit: RabbitMqHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness + readiness probe (db, redis, rabbitmq)' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('db', { timeout: 3000 }),
      () => this.redis.isHealthy('redis'),
      () => this.rabbit.isHealthy('rabbitmq'),
    ]);
  }
}
