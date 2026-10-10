import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  constructor(private app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(timeoutMs = 5000): Promise<void> {
    const redisClient = this.app.get<Redis>(REDIS_CLIENT);

    // We duplicate the redis connection because pub/sub requires separate connections
    const pubClient = redisClient.duplicate();
    const subClient = redisClient.duplicate();

    // Persistent error handlers prevent unhandled EventEmitter crash on reconnect/drop
    pubClient.on('error', (err) => this.logger.error('Redis Pub client error', err));
    subClient.on('error', (err) => this.logger.error('Redis Sub client error', err));

    const waitForClient = (client: Redis): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        if (client.status === 'ready') {
          resolve();
          return;
        }

        const onReady = () => {
          client.off('error', onError);
          resolve();
        };

        const onError = (err: unknown) => {
          client.off('ready', onReady);
          reject(err instanceof Error ? err : new Error(String(err)));
        };

        client.once('ready', onReady);
        client.once('error', onError);
      });
    };

    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Redis connection timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    });

    try {
      await Promise.race([
        Promise.all([waitForClient(pubClient), waitForClient(subClient)]),
        timeoutPromise,
      ]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (err) {
      pubClient.disconnect();
      subClient.disconnect();
      throw err;
    } finally {
      clearTimeout(timer!);
    }
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
