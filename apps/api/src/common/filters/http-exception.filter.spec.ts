import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './http-exception.filter';

type MockResponse = { status: jest.Mock; json: jest.Mock };

const makeHost = (
  method = 'GET',
  url = '/api/v1/test',
): { host: ArgumentsHost; res: MockResponse } => {
  const res: MockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const req = { method, url, originalUrl: url, headers: { 'x-request-id': 'req-abc' } };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as unknown as ArgumentsHost;
  return { host, res };
};

const mockConfig = (nodeEnv: string): ConfigService =>
  ({ get: (key: string): unknown => (key === 'NODE_ENV' ? nodeEnv : undefined) }) as ConfigService;

describe('HttpExceptionFilter', () => {
  it('should_format_http_exception_with_message_array', () => {
    const filter = new HttpExceptionFilter(mockConfig('development'));
    const { host, res } = makeHost();
    filter.catch(new BadRequestException(['email must be an email']), host);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const body = res.json.mock.calls[0]?.[0];
    expect(body.statusCode).toBe(400);
    expect(body.message).toEqual(['email must be an email']);
    expect(body.path).toBe('/api/v1/test');
    expect(body.requestId).toBe('req-abc');
    expect(typeof body.timestamp).toBe('string');
  });

  it('should_format_string_http_exception', () => {
    const filter = new HttpExceptionFilter(mockConfig('development'));
    const { host, res } = makeHost();
    filter.catch(new HttpException('forbidden', HttpStatus.FORBIDDEN), host);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json.mock.calls[0]?.[0].message).toBe('forbidden');
  });

  it('should_return_500_and_hide_error_message_in_production', () => {
    const filter = new HttpExceptionFilter(mockConfig('production'));
    const { host, res } = makeHost();
    filter.catch(new Error('boom secret internals'), host);

    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.json.mock.calls[0]?.[0];
    expect(body.message).toBe('Internal server error');
    expect(body.error).toBe('Error');
  });

  it('should_return_500_and_expose_error_message_in_non_production', () => {
    const filter = new HttpExceptionFilter(mockConfig('development'));
    const { host, res } = makeHost();
    filter.catch(new Error('boom'), host);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0]?.[0].message).toBe('boom');
  });
});
