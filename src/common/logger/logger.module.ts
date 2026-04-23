import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { LoggerModule as PinoModule } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'http';

@Module({
  imports: [
    PinoModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        const level = config.get<string>('LOG_LEVEL') ?? 'info';
        return {
          pinoHttp: {
            level,
            genReqId: (req: IncomingMessage, res: ServerResponse): string => {
              const existing = req.headers['x-request-id'];
              const id =
                typeof existing === 'string' && existing.length > 0 ? existing : randomUUID();
              res.setHeader('X-Request-Id', id);
              return id;
            },
            customProps: () => ({ service: 'nis-api' }),
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-telegram-bot-api-secret-token"]',
                'req.body.password',
                'req.body.oldPassword',
                'req.body.newPassword',
                'req.body.confirmPassword',
                'req.body.refreshToken',
                'req.body.token',
                'req.body.accessToken',
                'req.body.*.password',
                'req.body.*.token',
                'res.headers["set-cookie"]',
              ],
              censor: '[REDACTED]',
            },
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
                },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
