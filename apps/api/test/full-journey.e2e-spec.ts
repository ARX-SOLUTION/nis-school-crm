import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RoleName } from '../src/common/enums/role.enum';
import { bootstrapTestApp, resetDatabase } from './helpers/bootstrap-test-app';
import { authHeader, login, seedAndLogin } from './helpers/fixtures';

/**
 * Full happy-path journey:
 *   SA → create Manager
 *   Manager → create Teacher + a class + a student
 *   Manager → assign student to the class
 *   Teacher (newly created) → see the student on /teachers/me/students
 */
describe('Full user journey (e2e)', () => {
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

  it('should_complete_the_full_onboarding_flow', async () => {
    // 1. SA logs in.
    const sa = await seedAndLogin(app, dataSource, {
      email: 'sa@nis.test',
      password: 'sa-password-long',
      role: RoleName.SUPER_ADMIN,
    });

    // 2. SA creates a Manager.
    const mgrCreate = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set(authHeader(sa.tokens))
      .send({
        email: 'mgr@nis.test',
        fullName: 'The Manager',
        role: RoleName.MANAGER,
      })
      .expect(201);
    const managerPassword = mgrCreate.body.generatedPassword as string;
    const managerTokens = await login(app, 'mgr@nis.test', managerPassword);

    // 3. Manager creates a Teacher via /teachers (which runs User +
    //    TeacherProfile in one transaction).
    const teacherCreate = await request(app.getHttpServer())
      .post('/api/v1/teachers')
      .set(authHeader(managerTokens))
      .send({
        email: 'teacher@nis.test',
        fullName: 'The Teacher',
        subject: 'Mathematics',
      })
      .expect(201);
    const teacherUserId = teacherCreate.body.user.id as string;
    const teacherPassword = 'N/A — provisioned via event queue in prod';
    // We can't read the teacher's generated password from /teachers
    // because it piggy-backs on the user-created event. Reset the
    // password through the admin endpoint so we have a known one.
    const resetRes = await request(app.getHttpServer())
      .post(`/api/v1/users/${teacherUserId}/reset-password`)
      .set(authHeader(managerTokens))
      .expect(201);
    void teacherPassword;
    const teacherTokens = await login(
      app,
      'teacher@nis.test',
      resetRes.body.generatedPassword as string,
    );

    // 4. Manager creates a class (grade 4, active year).
    const classCreate = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set(authHeader(managerTokens))
      .send({
        name: '4-A',
        gradeLevel: 4,
        academicYear: '2026-2027',
        maxStudents: 2,
      })
      .expect(201);
    const classId = classCreate.body.id as string;

    // 5. Manager assigns the Teacher as class teacher.
    await request(app.getHttpServer())
      .patch(`/api/v1/classes/${classId}/assign-teacher`)
      .set(authHeader(managerTokens))
      .send({ teacherId: teacherUserId })
      .expect(200);

    // 6. Manager creates a student and assigns them to the class.
    const studentCreate = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set(authHeader(managerTokens))
      .send({
        firstName: 'Shaxzod',
        lastName: 'Karimov',
        birthDate: '2015-03-15',
        gradeLevel: 4,
        classId,
      })
      .expect(201);
    expect(studentCreate.body.studentCode).toMatch(/^NIS-\d{4}-\d{5}$/);
    expect(studentCreate.body.classId).toBe(classId);

    // 7. Teacher sees the student on /teachers/me/students (scoped to
    //    their class).
    const mine = await request(app.getHttpServer())
      .get('/api/v1/teachers/me/students')
      .set(authHeader(teacherTokens))
      .expect(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0].lastName).toBe('Karimov');

    // 8. Teacher cannot reach /students — manager+ endpoint.
    await request(app.getHttpServer())
      .get('/api/v1/students')
      .set(authHeader(teacherTokens))
      .expect(403);

    // 9. Manager cannot reach /teachers/me/students — runtime role-exact.
    await request(app.getHttpServer())
      .get('/api/v1/teachers/me/students')
      .set(authHeader(managerTokens))
      .expect(403);
  });

  it('should_enforce_class_capacity_on_assign_class', async () => {
    const sa = await seedAndLogin(app, dataSource, {
      email: 'sa@nis.test',
      password: 'sa-password-long',
      role: RoleName.SUPER_ADMIN,
    });

    const cls = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set(authHeader(sa.tokens))
      .send({ name: '4-A', gradeLevel: 4, academicYear: '2026-2027', maxStudents: 1 })
      .expect(201);
    const classId = cls.body.id as string;

    const s1 = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set(authHeader(sa.tokens))
      .send({
        firstName: 'First',
        lastName: 'Student',
        birthDate: '2015-01-01',
        gradeLevel: 4,
        classId,
      })
      .expect(201);
    expect(s1.body.classId).toBe(classId);

    // Second student hits capacity and gets rejected.
    const s2 = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set(authHeader(sa.tokens))
      .send({
        firstName: 'Second',
        lastName: 'Student',
        birthDate: '2015-01-01',
        gradeLevel: 4,
      })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/students/${s2.body.id}/assign-class`)
      .set(authHeader(sa.tokens))
      .send({ classId })
      .expect(400);
  });

  it('should_reject_grade_level_mismatch_on_assign_class', async () => {
    const sa = await seedAndLogin(app, dataSource, {
      email: 'sa@nis.test',
      password: 'sa-password-long',
      role: RoleName.SUPER_ADMIN,
    });

    const cls = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set(authHeader(sa.tokens))
      .send({ name: '5-B', gradeLevel: 5, academicYear: '2026-2027' })
      .expect(201);

    const st = await request(app.getHttpServer())
      .post('/api/v1/students')
      .set(authHeader(sa.tokens))
      .send({
        firstName: 'Wrong',
        lastName: 'Grade',
        birthDate: '2015-01-01',
        gradeLevel: 4,
      })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/students/${st.body.id}/assign-class`)
      .set(authHeader(sa.tokens))
      .send({ classId: cls.body.id })
      .expect(400);
  });
});
