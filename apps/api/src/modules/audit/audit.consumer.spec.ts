import { EVENT_AUDIT_WRITE } from '../../common/events/contracts';
import type { EventBusService, EventEnvelope } from '../../common/events/event-bus.service';
import { AuditConsumer } from './audit.consumer';
import type { AuditService } from './audit.service';

describe('AuditConsumer', () => {
  const buildConsumer = () => {
    let registeredHandler:
      | ((envelope: EventEnvelope<Record<string, unknown>>) => Promise<void>)
      | null = null;
    const bus = {
      consume: jest.fn(async (_spec, handler) => {
        registeredHandler = handler;
      }),
    } as unknown as EventBusService;
    const audit = { record: jest.fn().mockResolvedValue({}) } as unknown as AuditService;
    const consumer = new AuditConsumer(bus, audit);
    return {
      consumer,
      bus: bus as unknown as { consume: jest.Mock },
      audit: audit as unknown as { record: jest.Mock },
      invoke: async (envelope: EventEnvelope<unknown>) => {
        if (!registeredHandler) throw new Error('handler not registered');
        await registeredHandler(envelope as EventEnvelope<Record<string, unknown>>);
      },
    };
  };

  it('should_register_consumer_on_bootstrap', async () => {
    const { consumer, bus } = buildConsumer();
    await consumer.onApplicationBootstrap();
    expect(bus.consume).toHaveBeenCalledTimes(1);
    const spec = bus.consume.mock.calls[0]?.[0] as { queue: string; patterns: string[] };
    expect(spec.queue).toBe('audit.log');
    expect(spec.patterns).toContain('audit.*');
  });

  it('should_persist_audit_payload_on_audit_write_routing_key', async () => {
    const { consumer, audit, invoke } = buildConsumer();
    await consumer.onApplicationBootstrap();
    await invoke({
      messageId: 'm-1',
      occurredAt: new Date().toISOString(),
      routingKey: EVENT_AUDIT_WRITE,
      payload: {
        userId: 'u-1',
        action: 'CREATE',
        entityType: 'USER',
        entityId: 'x',
        oldData: null,
        newData: { email: 'a@x.com' },
        ipAddress: '1.2.3.4',
        userAgent: 'jest',
        statusCode: 201,
      },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-1', action: 'CREATE', entityType: 'USER' }),
    );
  });

  it('should_ignore_unknown_routing_keys_without_persisting', async () => {
    const { consumer, audit, invoke } = buildConsumer();
    await consumer.onApplicationBootstrap();
    await invoke({
      messageId: 'm-2',
      occurredAt: new Date().toISOString(),
      routingKey: 'audit.unexpected',
      payload: {
        userId: null,
        action: 'CREATE',
        entityType: null,
        entityId: null,
        oldData: null,
        newData: null,
        ipAddress: null,
        userAgent: null,
        statusCode: 200,
      },
    });
    expect(audit.record).not.toHaveBeenCalled();
  });
});
