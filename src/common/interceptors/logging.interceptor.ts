import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startedAt;
          this.logger.info(
            {
              method: request.method,
              path: request.originalUrl ?? request.url,
              statusCode: response.statusCode,
              durationMs: duration,
            },
            'request completed',
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startedAt;
          const message = err instanceof Error ? err.message : 'unknown';
          this.logger.warn(
            {
              method: request.method,
              path: request.originalUrl ?? request.url,
              durationMs: duration,
              error: message,
            },
            'request failed',
          );
        },
      }),
    );
  }
}
