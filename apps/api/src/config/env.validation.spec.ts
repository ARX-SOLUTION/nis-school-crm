import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  const baseValidEnv = {
    DB_HOST: 'localhost',
    DB_USER: 'postgres',
    DB_PASSWORD: 'postgres',
    DB_NAME: 'nis_crm',
    REDIS_HOST: 'localhost',
    RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    SEED_SUPER_ADMIN_EMAIL: 'admin@example.com',
    SEED_SUPER_ADMIN_PASSWORD: 'password123',
  };

  it('allows omitted gateway secrets in development mode', () => {
    const { error, value } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'development',
    });
    expect(error).toBeUndefined();
    expect(value.PAYME_KEY).toBe('');
    expect(value.CLICK_SECRET_KEY).toBe('');
  });

  it('allows omitted gateway secrets in test mode', () => {
    const { error, value } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'test',
    });
    expect(error).toBeUndefined();
    expect(value.PAYME_KEY).toBe('');
    expect(value.CLICK_SECRET_KEY).toBe('');
  });

  it('requires PAYME_KEY in production mode (DEF-07)', () => {
    const { error } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
      CLICK_SECRET_KEY: 'valid_click_secret',
    });
    expect(error).toBeDefined();
    expect(error?.message).toContain('"PAYME_KEY" is required');
  });

  it('requires CLICK_SECRET_KEY in production mode (DEF-07)', () => {
    const { error } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
      PAYME_KEY: 'valid_payme_key',
    });
    expect(error).toBeDefined();
    expect(error?.message).toContain('"CLICK_SECRET_KEY" is required');
  });

  it('rejects empty strings for gateway keys in production mode (DEF-07)', () => {
    const { error } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
      PAYME_KEY: '',
      CLICK_SECRET_KEY: 'valid_click_secret',
    });
    expect(error).toBeDefined();
    expect(error?.message).toContain('"PAYME_KEY" is not allowed to be empty');
  });

  it('rejects short secrets (< 8 chars) in production mode (DEF-07)', () => {
    const { error } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
      PAYME_KEY: 'short',
      CLICK_SECRET_KEY: 'valid_click_secret',
    });
    expect(error).toBeDefined();
    expect(error?.message).toContain('"PAYME_KEY" length must be at least 8 characters long');
  });

  it('passes in production mode when both gateway secrets are provided with min length (DEF-07)', () => {
    const { error, value } = envValidationSchema.validate({
      ...baseValidEnv,
      NODE_ENV: 'production',
      PAYME_KEY: 'payme_secret_key_123',
      CLICK_SECRET_KEY: 'click_secret_key_456',
    });
    expect(error).toBeUndefined();
    expect(value.PAYME_KEY).toBe('payme_secret_key_123');
    expect(value.CLICK_SECRET_KEY).toBe('click_secret_key_456');
  });
});
