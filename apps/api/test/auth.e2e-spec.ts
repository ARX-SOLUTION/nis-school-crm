import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RoleName } from '../src/common/enums/role.enum';
import { bootstrapTestApp, resetDatabase } from './helpers/bootstrap-test-app';
import { seedUser } from './helpers/fixtures';

describe('Auth (e2e)', () => {
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

  it('should_return_token_pair_on_valid_login', async () => {
    await seedUser(dataSource, {
      email: 'admin@nis.test',
      password: 'admin-password-long-enough',
      role: RoleName.ADMIN,
    });
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nis.test', password: 'admin-password-long-enough' })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user.role).toBe(RoleName.ADMIN);
  });

  it('should_reject_bad_credentials_with_401', async () => {
    await seedUser(dataSource, {
      email: 'admin@nis.test',
      password: 'admin-password-long-enough',
      role: RoleName.ADMIN,
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nis.test', password: 'wrong-password' })
      .expect(401);
  });

  it('should_rotate_refresh_token_and_reuse_should_revoke_family', async () => {
    await seedUser(dataSource, {
      email: 'admin@nis.test',
      password: 'admin-password-long-enough',
      role: RoleName.ADMIN,
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@nis.test', password: 'admin-password-long-enough' })
      .expect(200);

    const originalRefresh = login.body.refreshToken as string;

    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefresh })
      .expect(200);
    expect(rotated.body.refreshToken).not.toBe(originalRefresh);

    // Reusing the original refresh token must fail and burn the family.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefresh })
      .expect(401);

    // The rotated token is also revoked because the family was burned.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it('should_return_me_with_bearer_token', async () => {
    const user = await seedUser(dataSource, {
      email: 'teacher@nis.test',
      password: 'teacher-password-long',
      role: RoleName.TEACHER,
    });
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);
    const me = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(me.body.role).toBe(RoleName.TEACHER);
    expect(me.body.email).toBe(user.email);
  });
});
