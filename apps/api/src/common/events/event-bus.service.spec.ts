import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import { EventBusService } from './event-bus.service';

jest.mock('amqp-connection-manager');

describe('EventBusService', () => {
  let service: EventBusService;
  let mockConfigService: { getOrThrow: jest.Mock };
  let mockChannel: {
    waitForConnect: jest.Mock;
    assertExchange: jest.Mock;
    assertQueue: jest.Mock;
    bindQueue: jest.Mock;
    publish: jest.Mock;
    close: jest.Mock;
  };
  let mockConnection: {
    on: jest.Mock;
    createChannel: jest.Mock;
    close: jest.Mock;
  };

  beforeEach(() => {
    mockConfigService = {
      getOrThrow: jest.fn().mockReturnValue('amqp://localhost:5672'),
    };

    mockChannel = {
      waitForConnect: jest.fn().mockResolvedValue(undefined),
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      publish: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    mockConnection = {
      on: jest.fn(),
      createChannel: jest.fn().mockReturnValue(mockChannel),
      close: jest.fn().mockResolvedValue(undefined),
    };

    (amqp.connect as jest.Mock).mockReturnValue(mockConnection);

    service = new EventBusService(mockConfigService as unknown as ConfigService);
  });

  afterEach(async () => {
    await service.onApplicationShutdown();
  });

  it('initializes successfully when RabbitMQ connects immediately', async () => {
    await expect(service.onModuleInit()).resolves.toBeUndefined();
    expect(mockConnection.createChannel).toHaveBeenCalled();
  });

  it('does not hang or throw on bootstrap when RabbitMQ waitForConnect times out', async () => {
    // Simulate waitForConnect hanging forever
    mockChannel.waitForConnect.mockReturnValue(new Promise(() => {}));

    // Override timeout in test environment by mocking or letting it handle timeout
    // Using fake timers
    jest.useFakeTimers();

    const initPromise = service.onModuleInit();

    // Fast-forward past the 5000ms timeout
    jest.advanceTimersByTime(5100);

    await expect(initPromise).resolves.toBeUndefined();

    jest.useRealTimers();
  });

  it('does not crash when waitForConnect rejects with connection error', async () => {
    mockChannel.waitForConnect.mockRejectedValue(new Error('Connection refused'));

    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
