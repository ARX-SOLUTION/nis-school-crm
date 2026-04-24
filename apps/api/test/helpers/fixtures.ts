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

interface SeedClassOptions {
  name?: string;
  gradeLevel?: number;
  academicYear?: string;
  classTeacherId?: string;
  maxStudents?: number;
}

export async function seedClass(
  dataSource: DataSource,
  opts: SeedClassOptions = {},
): Promise<{ id: string; name: string; academicYear: string }> {
  const name = opts.name ?? `${opts.gradeLevel ?? 5}-A`;
  const academicYear = opts.academicYear ?? '2025-2026';
  const rows = await dataSource.query(
    `INSERT INTO "classes" ("name", "grade_level", "academic_year", "class_teacher_id", "max_students")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [name, opts.gradeLevel ?? 5, academicYear, opts.classTeacherId ?? null, opts.maxStudents ?? 30],
  );
  const id = (rows[0] as { id: string }).id;
  return { id, name, academicYear };
}

interface SeedSubjectOptions {
  code?: string;
  name?: string;
  gradeLevels?: number[];
  defaultHoursPerWeek?: number;
  isActive?: boolean;
}

export async function seedSubject(
  dataSource: DataSource,
  opts: SeedSubjectOptions = {},
): Promise<{ id: string; code: string }> {
  const code = opts.code ?? `SUBJ_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const rows = await dataSource.query(
    `INSERT INTO "subjects"
       ("code", "name", "grade_levels", "default_hours_per_week", "is_active")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      code,
      opts.name ?? 'Test Subject',
      opts.gradeLevels ?? [5, 6, 7],
      opts.defaultHoursPerWeek ?? 2,
      opts.isActive ?? true,
    ],
  );
  return { id: (rows[0] as { id: string }).id, code };
}

interface SeedRoomOptions {
  roomNumber?: string;
  name?: string;
  capacity?: number;
  type?: 'CLASSROOM' | 'LAB' | 'SPORTS' | 'AUDITORIUM' | 'OTHER';
  floor?: number;
  isActive?: boolean;
}

export async function seedRoom(
  dataSource: DataSource,
  opts: SeedRoomOptions = {},
): Promise<{ id: string; roomNumber: string }> {
  const roomNumber = opts.roomNumber ?? `R-${Math.random().toString(36).slice(2, 8)}`;
  const rows = await dataSource.query(
    `INSERT INTO "rooms" ("room_number", "name", "capacity", "type", "floor", "is_active")
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      roomNumber,
      opts.name ?? null,
      opts.capacity ?? 30,
      opts.type ?? 'CLASSROOM',
      opts.floor ?? null,
      opts.isActive ?? true,
    ],
  );
  return { id: (rows[0] as { id: string }).id, roomNumber };
}

interface SeedClassSubjectOptions {
  classId: string;
  subjectId: string;
  teacherId: string;
  hoursPerWeek?: number;
  academicYear?: string;
}

export async function seedClassSubject(
  dataSource: DataSource,
  opts: SeedClassSubjectOptions,
): Promise<{ id: string }> {
  const rows = await dataSource.query(
    `INSERT INTO "class_subjects"
       ("class_id", "subject_id", "teacher_id", "hours_per_week", "academic_year")
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      opts.classId,
      opts.subjectId,
      opts.teacherId,
      opts.hoursPerWeek ?? 2,
      opts.academicYear ?? '2025-2026',
    ],
  );
  return { id: (rows[0] as { id: string }).id };
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
