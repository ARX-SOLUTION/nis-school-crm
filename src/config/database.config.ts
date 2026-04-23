import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const buildTypeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => {
  const sslEnabled = config.get<boolean>('DB_SSL') === true;
  const rejectUnauthorized = config.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED') !== false;
  return {
    type: 'postgres',
    host: config.getOrThrow<string>('DB_HOST'),
    port: config.getOrThrow<number>('DB_PORT'),
    username: config.getOrThrow<string>('DB_USER'),
    password: config.getOrThrow<string>('DB_PASSWORD'),
    database: config.getOrThrow<string>('DB_NAME'),
    ssl: sslEnabled ? { rejectUnauthorized } : false,
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
    migrationsRun: false,
    synchronize: false,
    logging: config.get<string>('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
  };
};
