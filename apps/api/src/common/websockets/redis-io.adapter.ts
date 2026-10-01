import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplicationContext } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const redisClient = this.app.get<Redis>(REDIS_CLIENT);

    // We duplicate the redis connection because pub/sub requires separate connections
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    await Promise.all([
      new Promise<void>((resolve) => {
        pubClient.once('ready', () => resolve());
      }),
      new Promise<void>((resolve) => {
        subClient.once('ready', () => resolve());
      }),
    ]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: true,
        credentials: true,
      },
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
