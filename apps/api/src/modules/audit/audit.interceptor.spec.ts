import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { EVENT_AUDIT_WRITE } from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { AuditInterceptor } from './audit.interceptor';

const makeContext = (
  method: string,
  url: string,
  body: unknown = {},
  user?: { id: string; role: string },
  statusCode = 200,
  params: Record<string, string> = {},
): ExecutionContext => {
  const req = {
    method,
    url,
    originalUrl: url,
    headers: { 'user-agent': 'jest' },
    ip: '1.2.3.4',
    body,
    user,
    params,
  };
  const res = { statusCode };
  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ExecutionContext;
};

describe('AuditInterceptor', () => {
  let publish: jest.Mock;
  let interceptor: AuditInterceptor;

  beforeEach(() => {
    publish = jest.fn().mockResolvedValue(undefined);
    const bus = { publish } as unknown as EventBusService;
    interceptor = new AuditInterceptor(bus);
  });

  it('should_skip_get_requests', async () => {
    const handler: CallHandler = { handle: () => of({}) };
    await lastValueFrom(interceptor.intercept(makeContext('GET', '/api/v1/users'), handler));
    expect(publish).not.toHaveBeenCalled();
  });

  it('should_publish_audit_event_for_post_requests', async () => {
    const handler: CallHandler = { handle: () => of({ id: 'new-id' }) };
    await lastValueFrom(
      interceptor.intercept(
        makeContext(
          'POST',
          '/api/v1/users',
          { email: 'a@x.com' },
          { id: 'u1', role: 'ADMIN' },
          201,
        ),
        handler,
      ),
    );
    // tap fires synchronously on next, but the publish call is async — wait a tick.
    await new Promise((r) => setImmediate(r));
    expect(publish).toHaveBeenCalledTimes(1);
    const [routingKey, event] = publish.mock.calls[0] as [string, Record<string, unknown>];
    expect(routingKey).toBe(EVENT_AUDIT_WRITE);
    expect(event.action).toBe('CREATE');
    expect(event.entityType).toBe('USER');
    expect(event.entityId).toBe('new-id');
    expect(event.userId).toBe('u1');
    expect(event.statusCode).toBe(201);
  });

  it('should_strip_password_from_request_body_in_newData', async () => {
    const handler: CallHandler = { handle: () => of({ id: 'x' }) };
    await lastValueFrom(
      interceptor.intercept(
        makeContext(
          'POST',
          '/api/v1/auth/login',
          { email: 'a@x.com', password: 's3cret' },
          undefined,
          200,
        ),
        handler,
      ),
    );
    await new Promise((r) => setImmediate(r));
    const event = publish.mock.calls[0]?.[1] as { newData: Record<string, unknown> };
    expect(event.newData).toEqual({ email: 'a@x.com' });
    expect(JSON.stringify(event.newData)).not.toContain('s3cret');
  });

  it('should_map_login_path_to_LOGIN_action', async () => {
    const handler: CallHandler = { handle: () => of({}) };
    await lastValueFrom(interceptor.intercept(makeContext('POST', '/api/v1/auth/login'), handler));
    await new Promise((r) => setImmediate(r));
    const event = publish.mock.calls[0]?.[1] as { action: string };
    expect(event.action).toBe('LOGIN');
  });

  it('should_map_reset_password_path', async () => {
    const handler: CallHandler = { handle: () => of({}) };
    await lastValueFrom(
      interceptor.intercept(
        makeContext('POST', '/api/v1/users/u-1/reset-password', {}, undefined, 200, { id: 'u-1' }),
        handler,
      ),
    );
    await new Promise((r) => setImmediate(r));
    const event = publish.mock.calls[0]?.[1] as { action: string; entityId: string };
    expect(event.action).toBe('RESET_PASSWORD');
    expect(event.entityId).toBe('u-1');
  });

  it('should_map_delete_to_DELETE', async () => {
    const handler: CallHandler = { handle: () => of({}) };
    await lastValueFrom(
      interceptor.intercept(
        makeContext('DELETE', '/api/v1/students/s-1', {}, undefined, 204, { id: 's-1' }),
        handler,
      ),
    );
    await new Promise((r) => setImmediate(r));
    const event = publish.mock.calls[0]?.[1] as { action: string; entityType: string };
    expect(event.action).toBe('DELETE');
    expect(event.entityType).toBe('STUDENT');
  });

  it('should_swallow_publish_failure', async () => {
    publish.mockRejectedValueOnce(new Error('rabbit down'));
    const handler: CallHandler = { handle: () => of({ id: 'x' }) };
    // The main request pipeline must not reject on audit publish failure.
    await expect(
      lastValueFrom(
        interceptor.intercept(makeContext('POST', '/api/v1/users', {}, undefined, 201), handler),
      ),
    ).resolves.toBeDefined();
  });
});
