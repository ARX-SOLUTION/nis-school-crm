import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type Redis from 'ioredis';
import { AppModule } from '../../src/app.module';
import { REDIS_CLIENT } from '../../src/common/redis/redis.constants';

let cachedRedis: Redis | null = null;

export interface TestAppHandle {
  app: INestApplication;
  dataSource: DataSource;
  close: () => Promise<void>;
}

/**
 * Boots a full NestApplication the same way production does — global pipe,
 * `/api/v1` prefix, versioning, trust-proxy. Tests drive the app via
 * Supertest against `app.getHttpServer()`.
 */
export async function bootstrapTestApp(): Promise<TestAppHandle> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
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
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  await app.init();
  // @nestjs/typeorm registers the default DataSource under the DataSource
  // class token (not the string 'DataSource'). Resolving by the class
  // matches the token TypeOrmCoreModule actually uses.
  const dataSource = moduleRef.get(DataSource);
  if (!dataSource) {
    throw new Error('bootstrapTestApp: DataSource not resolved from AppModule');
  }
  try {
    cachedRedis = moduleRef.get<Redis>(REDIS_CLIENT);
  } catch {
    cachedRedis = null;
  }
  return {
    app,
    dataSource,
    close: async () => {
      try {
        await app.close();
      } catch {
        // Ignore teardown errors to prevent test hang
      }
      if (dataSource.isInitialized) {
        await dataSource.destroy().catch(() => undefined);
      }
    },
  };
}

/**
 * Truncate every table that tests mutate, preserving schema and sequences.
 * Safe to call between tests; ordered by FK dependency.
 */
export async function resetDatabase(dataSource: DataSource): Promise<void> {
  if (cachedRedis) {
    await cachedRedis.flushdb().catch(() => undefined);
  }
  await dataSource.query(
    'TRUNCATE TABLE ' +
      '"schedule_substitutions", "schedule_entries", ' +
      '"audit_logs", "student_class_history", "parent_students", "parent_invites", ' +
      '"class_subjects", "subjects", "rooms", ' +
      '"students", "teacher_profiles", ' +
      '"classes", "refresh_tokens", "users" ' +
      'RESTART IDENTITY CASCADE',
  );
  // students_code_seq is restarted by RESTART IDENTITY when it is owned by
  // a table; ours is a standalone sequence so reset it explicitly.
  await dataSource.query('ALTER SEQUENCE students_code_seq RESTART WITH 1');
}
