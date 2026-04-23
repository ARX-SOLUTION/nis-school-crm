import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));
  app.enableShutdownHooks();
  // Trust the first proxy hop (Caddy in production). Express then derives
  // `req.ip` from `X-Forwarded-For` only when the request actually came through
  // a trusted proxy, defeating spoofed XFF headers from direct callers.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const logger = new Logger('Bootstrap');

  app.use(helmet());

  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && corsOrigins.length === 0) {
    logger.warn(
      'CORS_ORIGINS is empty in production — all cross-origin requests will be rejected.',
    );
  }

  app.enableCors({
    // In non-production, an empty CORS_ORIGINS allows all origins (dev convenience).
    // In production, an empty list means reject all (the warning above flags this).
    origin: corsOrigins.length > 0 ? corsOrigins : !isProduction,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NIS School CRM API')
      .setDescription('REST API for Nordic International School CRM')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  logger.log(`NIS API listening on port ${port} (${process.env.NODE_ENV ?? 'development'})`);
}

void bootstrap();
