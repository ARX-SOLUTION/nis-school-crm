import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AuditWriteEvent, EVENT_AUDIT_WRITE } from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { sanitizePayload } from '../../common/utils/sanitize-payload';
import { AuthenticatedUser } from '../auth/types/authenticated-user';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly eventBus: EventBusService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthenticatedUser }>();
    const response = http.getResponse<Response>();

    if (!MUTATING_METHODS.has(request.method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.publishAudit(request, response.statusCode, data).catch((err) => {
            const reason = err instanceof Error ? err.message : 'unknown';
            this.logger.warn(`audit publish failed: ${reason}`);
          });
        },
      }),
    );
  }

  private async publishAudit(
    request: Request & { user?: AuthenticatedUser },
    statusCode: number,
    responseBody: unknown,
  ): Promise<void> {
    const action = describeAction(request.method, request.originalUrl ?? request.url);
    const entityType = extractEntityType(request.originalUrl ?? request.url);
    const entityId = extractEntityId(responseBody, request.params as Record<string, string>);

    const event: AuditWriteEvent = {
      userId: request.user?.id ?? null,
      action,
      entityType,
      entityId,
      ipAddress: request.ip ?? null,
      userAgent: (request.headers['user-agent'] as string | undefined) ?? null,
      oldData: null,
      newData: sanitizePayload(request.body),
      statusCode,
    };
    await this.eventBus.publish<AuditWriteEvent>(EVENT_AUDIT_WRITE, event);
  }
}

function describeAction(method: string, url: string): string {
  if (method === 'POST' && /reset-password/.test(url)) return 'RESET_PASSWORD';
  if (method === 'POST' && /assign-class/.test(url)) return 'ASSIGN_CLASS';
  if (method === 'POST' && /assign-teacher/.test(url)) return 'ASSIGN_TEACHER';
  if (method === 'POST' && /change-password/.test(url)) return 'CHANGE_PASSWORD';
  if (method === 'POST' && /login/.test(url)) return 'LOGIN';
  if (method === 'POST' && /logout/.test(url)) return 'LOGOUT';
  if (method === 'PATCH' && /assign-class/.test(url)) return 'ASSIGN_CLASS';
  if (method === 'PATCH' && /assign-teacher/.test(url)) return 'ASSIGN_TEACHER';
  if (method === 'POST') return 'CREATE';
  if (method === 'PATCH' || method === 'PUT') return 'UPDATE';
  if (method === 'DELETE') return 'DELETE';
  return method;
}

function extractEntityType(url: string): string | null {
  const match = /\/api\/v\d+\/([^/?]+)/.exec(url);
  if (!match) return null;
  const segment = match[1] as string;
  // Strip trailing 's' for friendlier entity names (students → STUDENT).
  return segment.toUpperCase().replace(/S$/, '');
}

function extractEntityId(responseBody: unknown, params: Record<string, string>): string | null {
  if (params && typeof params['id'] === 'string') return params['id'];
  if (responseBody && typeof responseBody === 'object') {
    const body = responseBody as Record<string, unknown>;
    if (typeof body['id'] === 'string') return body['id'];
    const nested = body['user'];
    if (
      nested &&
      typeof nested === 'object' &&
      typeof (nested as Record<string, unknown>)['id'] === 'string'
    ) {
      return (nested as Record<string, string>)['id'];
    }
  }
  return null;
}
