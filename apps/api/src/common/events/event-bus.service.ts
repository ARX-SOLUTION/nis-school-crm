import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { randomUUID } from 'crypto';

export const NIS_EXCHANGE = 'nis.events';

export interface EventEnvelope<T> {
  messageId: string;
  occurredAt: string;
  routingKey: string;
  payload: T;
}

@Injectable()
export class EventBusService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(EventBusService.name);
  private connection?: AmqpConnectionManager;
  private channel?: ChannelWrapper;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = amqp.connect([url]);
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown'}`),
    );

    this.channel = this.connection.createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange(NIS_EXCHANGE, 'topic', { durable: true });
      },
    });
    await this.channel.waitForConnect();
  }

  async publish<T>(routingKey: string, payload: T): Promise<void> {
    if (!this.channel) {
      throw new Error('EventBus channel is not ready');
    }
    const envelope: EventEnvelope<T> = {
      messageId: randomUUID(),
      occurredAt: new Date().toISOString(),
      routingKey,
      payload,
    };
    await this.channel.publish(NIS_EXCHANGE, routingKey, envelope, {
      persistent: true,
      messageId: envelope.messageId,
      timestamp: Date.now(),
      contentType: 'application/json',
    });
    this.logger.log(`event published: ${routingKey} (${envelope.messageId})`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
