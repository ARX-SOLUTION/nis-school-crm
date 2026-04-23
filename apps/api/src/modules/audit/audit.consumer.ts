import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { AuditWriteEvent, EVENT_AUDIT_WRITE } from '../../common/events/contracts';
import { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { AuditService } from './audit.service';

export const AUDIT_QUEUE = 'audit.log';

@Injectable()
export class AuditConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuditConsumer.name);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly audit: AuditService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.eventBus.consume<AuditWriteEvent>(
      { queue: AUDIT_QUEUE, patterns: ['audit.*'], maxRetries: 3 },
      (envelope) => this.handle(envelope),
    );
  }

  private async handle(envelope: EventEnvelope<AuditWriteEvent>): Promise<void> {
    if (envelope.routingKey !== EVENT_AUDIT_WRITE) {
      this.logger.warn(`skipping unknown audit routing key: ${envelope.routingKey}`);
      return;
    }
    const p = envelope.payload;
    await this.audit.record({
      userId: p.userId,
      action: p.action,
      entityType: p.entityType,
      entityId: p.entityId,
      oldData: p.oldData,
      newData: p.newData,
      ipAddress: p.ipAddress,
      userAgent: p.userAgent,
      statusCode: p.statusCode,
    });
  }
}
