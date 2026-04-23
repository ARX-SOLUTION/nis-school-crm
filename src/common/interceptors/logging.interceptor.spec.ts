import { CallHandler, ExecutionContext } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom, of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

const makeContext = (method = 'GET', url = '/api/v1/ping'): ExecutionContext => {
  const req = { method, url, originalUrl: url };
  const res = { statusCode: 200 };
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ExecutionContext;
};

const mockLogger = (): PinoLogger =>
  ({
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  }) as unknown as PinoLogger;

describe('LoggingInterceptor', () => {
  it('should_passthrough_successful_response_and_log_info', async () => {
    const logger = mockLogger();
    const interceptor = new LoggingInterceptor(logger);
    const handler: CallHandler = { handle: () => of('ok') };

    const result = await lastValueFrom(interceptor.intercept(makeContext(), handler));
    expect(result).toBe('ok');
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('should_propagate_errors_and_log_warn', async () => {
    const logger = mockLogger();
    const interceptor = new LoggingInterceptor(logger);
    const handler: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    await expect(lastValueFrom(interceptor.intercept(makeContext(), handler))).rejects.toThrow(
      'boom',
    );
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('should_skip_non_http_contexts', async () => {
    const logger = mockLogger();
    const interceptor = new LoggingInterceptor(logger);
    const nonHttp = { getType: () => 'rpc' } as unknown as ExecutionContext;
    const handler: CallHandler = { handle: () => of('bypass') };

    const result = await lastValueFrom(interceptor.intercept(nonHttp, handler));
    expect(result).toBe('bypass');
    expect(logger.info).not.toHaveBeenCalled();
  });
});
