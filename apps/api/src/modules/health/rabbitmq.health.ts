import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { connect, ChannelModel } from 'amqplib';

@Injectable()
export class RabbitMqHealthIndicator extends HealthIndicator {
  private readonly url: string;

  constructor(config: ConfigService) {
    super();
    this.url = config.getOrThrow<string>('RABBITMQ_URL');
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    let connection: ChannelModel | undefined;
    try {
      connection = await connect(this.url, { timeout: 3000 });
      return this.getStatus(key, true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError(
        'RabbitMQ check failed',
        this.getStatus(key, false, { error: message }),
      );
    } finally {
      if (connection) {
        await connection.close().catch(() => undefined);
      }
    }
  }
}
