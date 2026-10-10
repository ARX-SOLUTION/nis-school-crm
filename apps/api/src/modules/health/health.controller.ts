import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator';
import { RedisHealthIndicator } from '../../common/redis/redis.health';
import { RabbitMqHealthIndicator } from './rabbitmq.health';

@ApiTags('health')
@SkipThrottle()
@Controller({ path: 'health', version: ['1'] })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly rabbit: RabbitMqHealthIndicator,
  ) {}

  @Public()
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

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Process liveness probe' })
  live(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Dependency readiness probe (db, redis, rabbitmq)' })
  async ready(): Promise<HealthCheckResult> {
    return this.check();
  }
}
