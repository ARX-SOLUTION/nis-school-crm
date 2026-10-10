import { EventEmitter } from 'events';
import { INestApplicationContext } from '@nestjs/common';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RedisIoAdapter } from './redis-io.adapter';

class MockRedisClient extends EventEmitter {
  public status = 'connecting';
  public duplicate = jest.fn(() => new MockRedisClient());
  public disconnect = jest.fn();
}

describe('RedisIoAdapter', () => {
  let app: jest.Mocked<INestApplicationContext>;
  let mockRedisClient: MockRedisClient;
  let pubClient: MockRedisClient;
  let subClient: MockRedisClient;
  let adapter: RedisIoAdapter;

  beforeEach(() => {
    mockRedisClient = new MockRedisClient();
    pubClient = new MockRedisClient();
    subClient = new MockRedisClient();

    mockRedisClient.duplicate
      .mockReturnValueOnce(pubClient as never)
      .mockReturnValueOnce(subClient as never);

    app = {
      get: jest.fn().mockImplementation((token: unknown) => {
        if (token === REDIS_CLIENT) {
          return mockRedisClient;
        }
        return null;
      }),
    } as unknown as jest.Mocked<INestApplicationContext>;

    adapter = new RedisIoAdapter(app);
  });

  it('connects successfully when both pub and sub clients become ready', async () => {
    const connectPromise = adapter.connectToRedis(1000);

    pubClient.emit('ready');
    subClient.emit('ready');

    await expect(connectPromise).resolves.toBeUndefined();
  });

  it('rejects when pubClient emits error', async () => {
    const connectPromise = adapter.connectToRedis(1000);

    pubClient.emit('error', new Error('Pub connection refused'));

    await expect(connectPromise).rejects.toThrow('Pub connection refused');
    expect(pubClient.disconnect).toHaveBeenCalled();
    expect(subClient.disconnect).toHaveBeenCalled();
  });

  it('times out and rejects when clients do not respond within timeout', async () => {
    const connectPromise = adapter.connectToRedis(50);

    await expect(connectPromise).rejects.toThrow('Redis connection timed out after 50ms');
    expect(pubClient.disconnect).toHaveBeenCalled();
    expect(subClient.disconnect).toHaveBeenCalled();
  });

  it('attaches persistent error listeners that handle errors after connect (DEF-04)', async () => {
    const connectPromise = adapter.connectToRedis(1000);
    pubClient.emit('ready');
    subClient.emit('ready');
    await connectPromise;

    // Emitting error after connection should not throw unhandled exception
    expect(() => {
      pubClient.emit('error', new Error('Connection reset by peer'));
      subClient.emit('error', new Error('Connection reset by peer'));
    }).not.toThrow();
  });
});
