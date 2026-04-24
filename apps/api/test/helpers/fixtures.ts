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
  telegramChatId?: string;
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
    `INSERT INTO "users" ("email", "password_hash", "full_name", "role", "is_active", "must_change_password", "telegram_chat_id")
     VALUES ($1, $2, $3, $4, true, false, $5)
     RETURNING id`,
    [
      opts.email,
      passwordHash,
      opts.fullName ?? `${opts.role} user`,
      opts.role,
      opts.telegramChatId ?? null,
    ],
  );
  const id = (rows[0] as { id: string }).id;
  return { id, email: opts.email, password: opts.password, role: opts.role };
}

interface SeedStudentOptions {
  firstName?: string;
  lastName?: string;
  gradeLevel?: number;
  birthDate?: string;
}

/**
 * Insert a student directly via the DataSource for use in e2e tests.
 * Returns the persisted id.
 */
export async function seedStudent(
  dataSource: DataSource,
  opts: SeedStudentOptions = {},
): Promise<{ id: string }> {
  const rows = await dataSource.query(
    `INSERT INTO "students" ("first_name", "last_name", "birth_date", "grade_level", "status")
     VALUES ($1, $2, $3, $4, 'ACTIVE')
     RETURNING id`,
    [
      opts.firstName ?? 'Test',
      opts.lastName ?? 'Student',
      opts.birthDate ?? '2015-01-01',
      opts.gradeLevel ?? 5,
    ],
  );
  const id = (rows[0] as { id: string }).id;
  return { id };
}

interface SeedParentInviteOptions {
  studentId: string;
  createdById: string;
  expiresAt?: Date;
  usedAt?: Date | null;
}

/**
 * Insert a parent invite directly via the DataSource for use in e2e tests.
 * Returns the full row including the plaintext token.
 */
export async function seedParentInvite(
  dataSource: DataSource,
  opts: SeedParentInviteOptions,
): Promise<{ id: string; token: string; studentId: string; expiresAt: Date }> {
  const { randomBytes } = await import('crypto');
  const token = randomBytes(32).toString('hex');
  const expiresAt = opts.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const usedAt = opts.usedAt ?? null;

  const rows = await dataSource.query(
    `INSERT INTO "parent_invites" ("token", "student_id", "created_by_id", "expires_at", "used_at")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [token, opts.studentId, opts.createdById, expiresAt, usedAt],
  );
  const id = (rows[0] as { id: string }).id;
  return { id, token, studentId: opts.studentId, expiresAt };
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
