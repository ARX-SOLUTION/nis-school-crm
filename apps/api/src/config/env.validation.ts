import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  APP_URL: Joi.string().uri().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().uri().allow('').default(''),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  CORS_ORIGINS: Joi.string().allow('').default(''),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),

  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().integer().min(0).default(0),

  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
  // Refresh tokens are opaque random bytes (sha256-hashed in DB), not signed
  // JWTs, so no JWT_REFRESH_SECRET is needed. JWT_REFRESH_EXPIRES drives the
  // DB row TTL only.
  JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

  BCRYPT_COST: Joi.number().integer().min(10).max(15).default(12),
  THROTTLE_TTL: Joi.number().integer().min(1).default(60),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(100),
  AUTH_THROTTLE_TTL: Joi.number().integer().min(1).default(900),
  AUTH_THROTTLE_LIMIT: Joi.number().integer().min(1).default(5),

  TELEGRAM_BOT_TOKEN: Joi.string().allow('').default(''),
  TELEGRAM_WEBHOOK_URL: Joi.string().uri().allow('').default(''),
  TELEGRAM_WEBHOOK_SECRET: Joi.string()
    .allow('')
    .default('')
    .when('TELEGRAM_WEBHOOK_URL', {
      is: Joi.string().uri().required(),
      then: Joi.string().min(16).required(),
    }),

  SEED_SUPER_ADMIN_EMAIL: Joi.string().email().required(),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().min(8).required(),
  SEED_SUPER_ADMIN_NAME: Joi.string().default('Super Admin'),

  TELEGRAM_BOT_USERNAME: Joi.string().allow('').default(''),
  TELEGRAM_LOGIN_DOMAIN: Joi.string().allow('').default(''),

  // Feature flags — all default to false. Enable per-environment via env vars.
  FEATURE_TELEGRAM_LOGIN_ENABLED: Joi.boolean().default(false),
  FEATURE_PARENT_PORTAL_ENABLED: Joi.boolean().default(false),
  FEATURE_ATTENDANCE_ENABLED: Joi.boolean().default(false),
  FEATURE_GRADES_ENABLED: Joi.boolean().default(false),
  FEATURE_SCHEDULE_ENABLED: Joi.boolean().default(false),
  FEATURE_WEBSOCKET_ENABLED: Joi.boolean().default(false),
});
