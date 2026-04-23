import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type { RoleName } from '../../src/common/enums/role.enum';

interface SeedUserOptions {
  email: string;
  password: string;
  role: RoleName;
  fullName?: string;
}

/**
 * Insert a user directly via the DataSource so tests can authenticate with
 * known credentials without going through the admin-only user creation
 * endpoint. Returns the persisted id so e2e tests can reference it.
 */
export async function seedUser(
  dataSource: DataSource,
  opts: SeedUserOptions,
): Promise<{ id: string; email: string; password: string; role: RoleName }> {
  const passwordHash = await bcrypt.hash(opts.password, 4);
  const rows = await dataSource.query(
    `INSERT INTO "users" ("email", "password_hash", "full_name", "role", "is_active", "must_change_password")
     VALUES ($1, $2, $3, $4, true, false)
     RETURNING id`,
    [opts.email, passwordHash, opts.fullName ?? `${opts.role} user`, opts.role],
  );
  const id = (rows[0] as { id: string }).id;
  return { id, email: opts.email, password: opts.password, role: opts.role };
}

interface LoginTokens {
  accessToken: string;
  refreshToken: string;
}

export async function login(
  app: INestApplication,
  email: string,
  password: string,
): Promise<LoginTokens> {
  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);
  return res.body as LoginTokens;
}

export async function seedAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  opts: SeedUserOptions,
): Promise<{ id: string; email: string; role: RoleName; tokens: LoginTokens }> {
  const user = await seedUser(dataSource, opts);
  const tokens = await login(app, user.email, user.password);
  return { id: user.id, email: user.email, role: user.role, tokens };
}

export function authHeader(tokens: LoginTokens): { Authorization: string } {
  return { Authorization: `Bearer ${tokens.accessToken}` };
}
