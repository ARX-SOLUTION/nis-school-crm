import { Global, Inject, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisHealthIndicator } from './redis.health';

const redisProvider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    const logger = new Logger('RedisClient');
    const password = config.get<string>('REDIS_PASSWORD') || undefined;
    const client = new Redis({
      host: config.getOrThrow<string>('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      password,
      db: config.get<number>('REDIS_DB') ?? 0,
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
    client.on('error', (err: Error) => logger.error(`Redis error: ${err.message}`));
    client.on('ready', () => logger.log('Redis ready'));
    return client;
  },
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider, RedisHealthIndicator],
  exports: [REDIS_CLIENT, RedisHealthIndicator],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit().catch(() => undefined);
  }
}
