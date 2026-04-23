import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from '../../common/redis/redis.health';
import { RabbitMqHealthIndicator } from './rabbitmq.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheck: { check: jest.Mock };
  let db: { pingCheck: jest.Mock };
  let redis: { isHealthy: jest.Mock };
  let rabbit: { isHealthy: jest.Mock };

  beforeEach(async () => {
    healthCheck = {
      check: jest.fn(async (indicators: Array<() => Promise<unknown>>) => {
        await Promise.all(indicators.map((fn) => fn()));
        return { status: 'ok' };
      }),
    };
    db = { pingCheck: jest.fn().mockResolvedValue({ db: { status: 'up' } }) };
    redis = { isHealthy: jest.fn().mockResolvedValue({ redis: { status: 'up' } }) };
    rabbit = { isHealthy: jest.fn().mockResolvedValue({ rabbitmq: { status: 'up' } }) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: healthCheck },
        { provide: TypeOrmHealthIndicator, useValue: db },
        { provide: RedisHealthIndicator, useValue: redis },
        { provide: RabbitMqHealthIndicator, useValue: rabbit },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should_delegate_to_health_check_service', async () => {
    const result = await controller.check();
    expect(healthCheck.check).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 'ok' });
  });

  it('should_invoke_db_redis_and_rabbitmq_indicators', async () => {
    await controller.check();
    expect(db.pingCheck).toHaveBeenCalledWith('db', expect.objectContaining({ timeout: 3000 }));
    expect(redis.isHealthy).toHaveBeenCalledWith('redis');
    expect(rabbit.isHealthy).toHaveBeenCalledWith('rabbitmq');
  });
});
