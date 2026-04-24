/**
 * jest setupFilesAfterEach runs once per test file. We load the per-test env
 * here so every file can `import { bootstrapTestApp }` without plumbing
 * env into every spec. In CI the compose stack provides the services via
 * `services:` blocks; locally the developer brings them up via
 * `docker compose -f docker-compose.dev.yml up -d`.
 */

process.env['NODE_ENV'] = process.env['NODE_ENV'] ?? 'test';
process.env['LOG_LEVEL'] = process.env['LOG_LEVEL'] ?? 'error';
process.env['DB_HOST'] = process.env['DB_HOST'] ?? 'localhost';
process.env['DB_PORT'] = process.env['DB_PORT'] ?? '5432';
process.env['DB_USER'] = process.env['DB_USER'] ?? 'nis_admin';
process.env['DB_PASSWORD'] = process.env['DB_PASSWORD'] ?? 'change_me_strong';
process.env['DB_NAME'] = process.env['DB_NAME'] ?? 'nis_crm_test';
process.env['REDIS_HOST'] = process.env['REDIS_HOST'] ?? 'localhost';
process.env['REDIS_PORT'] = process.env['REDIS_PORT'] ?? '6379';
process.env['REDIS_PASSWORD'] = process.env['REDIS_PASSWORD'] ?? 'change_me_strong';
process.env['RABBITMQ_URL'] =
  process.env['RABBITMQ_URL'] ?? 'amqp://nis_mq:change_me_strong@localhost:5672';
process.env['JWT_ACCESS_SECRET'] =
  process.env['JWT_ACCESS_SECRET'] ??
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env['JWT_ACCESS_EXPIRES'] = process.env['JWT_ACCESS_EXPIRES'] ?? '15m';
process.env['JWT_REFRESH_EXPIRES'] = process.env['JWT_REFRESH_EXPIRES'] ?? '1d';
// Joi enforces BCRYPT_COST >= 10 so auth stays prod-strength. Slightly
// slower tests are acceptable — total suite time is dominated by DB
// setup, not password hashing.
process.env['BCRYPT_COST'] = process.env['BCRYPT_COST'] ?? '10';
process.env['CORS_ORIGINS'] = process.env['CORS_ORIGINS'] ?? '';
process.env['TELEGRAM_BOT_TOKEN'] =
  process.env['TELEGRAM_BOT_TOKEN'] ?? 'e2e-test-bot-token-not-a-real-secret';
process.env['FEATURE_TELEGRAM_LOGIN_ENABLED'] =
  process.env['FEATURE_TELEGRAM_LOGIN_ENABLED'] ?? 'true';
process.env['FEATURE_PARENT_PORTAL_ENABLED'] =
  process.env['FEATURE_PARENT_PORTAL_ENABLED'] ?? 'true';
process.env['AUTH_THROTTLE_TTL'] = process.env['AUTH_THROTTLE_TTL'] ?? '60';
process.env['AUTH_THROTTLE_LIMIT'] = process.env['AUTH_THROTTLE_LIMIT'] ?? '5';
// Joi's default TLD allow-list rejects reserved TLDs like `.test`, so
// use a real one here. The address only ever lives in the e2e DB.
process.env['SEED_SUPER_ADMIN_EMAIL'] =
  process.env['SEED_SUPER_ADMIN_EMAIL'] ?? 'e2e-admin@example.com';
process.env['SEED_SUPER_ADMIN_PASSWORD'] =
  process.env['SEED_SUPER_ADMIN_PASSWORD'] ?? 'e2e-super-admin-password!';
