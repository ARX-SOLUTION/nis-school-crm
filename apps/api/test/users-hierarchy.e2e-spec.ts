import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RoleName } from '../src/common/enums/role.enum';
import { bootstrapTestApp, resetDatabase } from './helpers/bootstrap-test-app';
import { authHeader, seedAndLogin } from './helpers/fixtures';

describe('Users role hierarchy (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let close: () => Promise<void>;

  beforeAll(async () => {
    const handle = await bootstrapTestApp();
    app = handle.app;
    dataSource = handle.dataSource;
    close = handle.close;
  });

  afterAll(async () => close());

  beforeEach(async () => resetDatabase(dataSource));

  const uniqueEmail = (prefix: string): string =>
    `${prefix}-${Math.random().toString(36).slice(2, 8)}@nis.test`;

  it('should_let_admin_create_a_manager', async () => {
    const admin = await seedAndLogin(app, dataSource, {
      email: uniqueEmail('admin'),
      password: 'admin-password-long',
      role: RoleName.ADMIN,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(admin.tokens))
      .send({
        email: uniqueEmail('new-manager'),
        fullName: 'Manager Mal',
        role: RoleName.MANAGER,
      })
      .expect(201);

    expect(res.body.user.role).toBe(RoleName.MANAGER);
    expect(res.body.generatedPassword).toEqual(expect.any(String));
    expect(res.body.generatedPassword.length).toBeGreaterThanOrEqual(12);
  });

  it('should_forbid_manager_from_creating_another_manager', async () => {
    const manager = await seedAndLogin(app, dataSource, {
      email: uniqueEmail('mgr'),
      password: 'mgr-password-long',
      role: RoleName.MANAGER,
    });

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(manager.tokens))
      .send({
        email: uniqueEmail('peer'),
        fullName: 'Peer Manager',
        role: RoleName.MANAGER,
      })
      .expect(403);
  });

  it('should_reject_super_admin_creation_via_api_even_for_super_admin', async () => {
    const sa = await seedAndLogin(app, dataSource, {
      email: uniqueEmail('sa'),
      password: 'sa-password-long',
      role: RoleName.SUPER_ADMIN,
    });

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(sa.tokens))
      .send({
        email: uniqueEmail('other-sa'),
        fullName: 'Another SA',
        role: RoleName.SUPER_ADMIN,
      })
      .expect(403);
  });

  it('should_forbid_teacher_from_hitting_users_endpoints', async () => {
    const teacher = await seedAndLogin(app, dataSource, {
      email: uniqueEmail('teacher'),
      password: 'teacher-password-long',
      role: RoleName.TEACHER,
    });

    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set(authHeader(teacher.tokens))
      .expect(403);
  });

  it('should_reject_duplicate_email_with_409', async () => {
    const admin = await seedAndLogin(app, dataSource, {
      email: uniqueEmail('admin'),
      password: 'admin-password-long',
      role: RoleName.ADMIN,
    });

    const email = uniqueEmail('dup');
    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(admin.tokens))
      .send({ email, fullName: 'First', role: RoleName.TEACHER })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(admin.tokens))
      .send({ email, fullName: 'Second', role: RoleName.TEACHER })
      .expect(409);
  });
});
