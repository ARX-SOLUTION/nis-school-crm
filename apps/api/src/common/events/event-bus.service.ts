import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto';

export const NIS_EXCHANGE = 'nis.events';
export const NIS_DLX = 'nis.dlx';
export const NIS_DLQ = 'nis.dlq';

export interface EventEnvelope<T> {
  messageId: string;
  occurredAt: string;
  routingKey: string;
  payload: T;
}

export interface QueueSpec {
  /** Queue name. */
  queue: string;
  /** Routing-key patterns to bind against `nis.events` (topic). */
  patterns: string[];
  /** Per-message max retries before the DLQ. Defaults to 3. */
  maxRetries?: number;
}

export type ConsumerHandler<T> = (envelope: EventEnvelope<T>) => Promise<void>;

/**
 * Retry delays in ms. A failed attempt N uses DELAYS[N-1]; after
 * maxRetries attempts the message is nacked to the DLX.
 */
const DELAYS = [1000, 5000, 25000];

@Injectable()
export class EventBusService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(EventBusService.name);
  private connection?: AmqpConnectionManager;
  private publishChannel?: ChannelWrapper;
  private readonly consumerChannels: ChannelWrapper[] = [];

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = amqp.connect([url]);
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`RabbitMQ disconnected: ${err?.message ?? 'unknown'}`),
    );

    this.publishChannel = this.connection.createChannel({
      json: true,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertExchange(NIS_EXCHANGE, 'topic', { durable: true });
        await ch.assertExchange(NIS_DLX, 'fanout', { durable: true });
        await ch.assertQueue(NIS_DLQ, { durable: true });
        await ch.bindQueue(NIS_DLQ, NIS_DLX, '');
      },
    });
    await this.publishChannel.waitForConnect();
  }

  async publish<T>(routingKey: string, payload: T): Promise<void> {
    if (!this.publishChannel) {
      throw new Error('EventBus channel is not ready');
    }
    const envelope: EventEnvelope<T> = {
      messageId: randomUUID(),
      occurredAt: new Date().toISOString(),
      routingKey,
      payload,
    };
    await this.publishChannel.publish(NIS_EXCHANGE, routingKey, envelope, {
      persistent: true,
      messageId: envelope.messageId,
      timestamp: Date.now(),
      contentType: 'application/json',
    });
    this.logger.log(`event published: ${routingKey} (${envelope.messageId})`);
  }

  /**
   * Register a durable consumer against `nis.events`. The queue is declared
   * with a dead-letter exchange so nacked messages land on `nis.dlq`.
   *
   * Retry is in-process: on handler error, the message is republished after
   * an exponential delay (1s, 5s, 25s) up to `maxRetries` times. Proper
   * delay queues land in Stage 9; this MVP pattern is acceptable because a
   * process crash during backoff just drops the in-flight retry to the
   * original unacked delivery, which RabbitMQ redelivers.
   */
  async consume<T>(spec: QueueSpec, handler: ConsumerHandler<T>): Promise<void> {
    if (!this.connection) throw new Error('EventBus connection not ready');
    const maxRetries = spec.maxRetries ?? 3;
    const logger = this.logger;

    const channel = this.connection.createChannel({
      json: false,
      setup: async (ch: ConfirmChannel) => {
        await ch.assertQueue(spec.queue, {
          durable: true,
          deadLetterExchange: NIS_DLX,
        });
        for (const pattern of spec.patterns) {
          await ch.bindQueue(spec.queue, NIS_EXCHANGE, pattern);
        }
        await ch.prefetch(10);
        await ch.consume(spec.queue, (msg: ConsumeMessage | null) => {
          if (!msg) return;
          void processMessage(ch, msg);
        });
      },
    });

    async function processMessage(ch: ConfirmChannel, msg: ConsumeMessage): Promise<void> {
      const raw = msg.content.toString();
      let envelope: EventEnvelope<T>;
      try {
        envelope = JSON.parse(raw) as EventEnvelope<T>;
      } catch {
        logger.error(`invalid envelope json on ${spec.queue}, dropping to DLQ`);
        ch.nack(msg, false, false);
        return;
      }

      try {
        await handler(envelope);
        ch.ack(msg);
        return;
      } catch (err) {
        const attempt = Number(msg.properties.headers?.['x-retry'] ?? 0) + 1;
        const reason = err instanceof Error ? err.message : 'unknown';
        if (attempt > maxRetries) {
          logger.error(
            `consumer ${spec.queue} exhausted ${maxRetries} retries for ${envelope.messageId} (${reason}); → DLQ`,
          );
          ch.nack(msg, false, false);
          return;
        }

        const delayMs = DELAYS[attempt - 1] ?? 60000;
        logger.warn(
          `consumer ${spec.queue} error on ${envelope.messageId}: ${reason}; retry ${attempt}/${maxRetries} in ${delayMs}ms`,
        );
        setTimeout(() => {
          try {
            ch.publish(NIS_EXCHANGE, envelope.routingKey, Buffer.from(raw), {
              ...msg.properties,
              headers: { ...(msg.properties.headers ?? {}), 'x-retry': attempt },
              contentType: 'application/json',
              persistent: true,
            });
            ch.ack(msg);
          } catch (publishErr) {
            logger.error(
              `failed to republish retry for ${envelope.messageId}: ${
                publishErr instanceof Error ? publishErr.message : 'unknown'
              }`,
            );
            ch.nack(msg, false, false);
          }
        }, delayMs);
      }
    }

    await channel.waitForConnect();
    this.consumerChannels.push(channel);
    this.logger.log(`consumer registered: ${spec.queue} bound to ${spec.patterns.join(', ')}`);
  }

  async onApplicationShutdown(): Promise<void> {
    for (const ch of this.consumerChannels) {
      await ch.close().catch(() => undefined);
    }
    await this.publishChannel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }
}
