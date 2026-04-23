import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

try {
  process.loadEnvFile('.env');
} catch {
  // .env is optional when env vars are provided directly
}

const envOrThrow = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
};

const parsePort = (raw: string): number => {
  const port = parseInt(raw, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`DB_PORT must be an integer in 1..65535, got: ${raw}`);
  }
  return port;
};

const sslEnabled = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: envOrThrow('DB_HOST'),
  port: parsePort(envOrThrow('DB_PORT')),
  username: envOrThrow('DB_USER'),
  password: envOrThrow('DB_PASSWORD'),
  database: envOrThrow('DB_NAME'),
  ssl: sslEnabled ? { rejectUnauthorized } : false,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
};

export const AppDataSource = new DataSource(dataSourceOptions);
