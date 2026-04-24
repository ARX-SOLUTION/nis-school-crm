import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RoleName } from '../src/common/enums/role.enum';
import { bootstrapTestApp, resetDatabase } from './helpers/bootstrap-test-app';
import { seedAndLogin, seedClass, seedSubject, seedUser, authHeader } from './helpers/fixtures';

describe('Subjects & ClassSubjects (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ app, dataSource, close } = await bootstrapTestApp());
  });

  afterAll(async () => {
    await close();
  });

  beforeEach(async () => {
    await resetDatabase(dataSource);
  });

  async function seedAdmin() {
    return seedAndLogin(app, dataSource, {
      email: 'admin@example.com',
      password: 'admin-password-long-enough',
      role: RoleName.ADMIN,
    });
  }

  async function seedManager() {
    return seedAndLogin(app, dataSource, {
      email: 'manager@example.com',
      password: 'manager-password-long-enough',
      role: RoleName.MANAGER,
    });
  }

  async function seedTeacher(email = 'teacher@example.com') {
    return seedAndLogin(app, dataSource, {
      email,
      password: 'teacher-password-long-enough',
      role: RoleName.TEACHER,
    });
  }

  describe('POST /subjects', () => {
    it('allows ADMIN to create a subject with uppercase code', async () => {
      const admin = await seedAdmin();
      const res = await request(app.getHttpServer())
        .post('/api/v1/subjects')
        .set(authHeader(admin.tokens))
        .send({ code: 'math_7', name: 'Math 7', gradeLevels: [7] })
        .expect(201);
      expect(res.body).toMatchObject({ code: 'MATH_7', name: 'Math 7', gradeLevels: [7] });
      expect(res.body.id).toBeDefined();
    });

    it('allows MANAGER to create a subject', async () => {
      const manager = await seedManager();
      await request(app.getHttpServer())
        .post('/api/v1/subjects')
        .set(authHeader(manager.tokens))
        .send({ code: 'ENG_7', name: 'English 7', gradeLevels: [7] })
        .expect(201);
    });

    it('rejects TEACHER attempts with 403', async () => {
      const teacher = await seedTeacher();
      await request(app.getHttpServer())
        .post('/api/v1/subjects')
        .set(authHeader(teacher.tokens))
        .send({ code: 'SCI_7', name: 'Science 7', gradeLevels: [7] })
        .expect(403);
    });

    it('returns 409 on duplicate code', async () => {
      const admin = await seedAdmin();
      await seedSubject(dataSource, { code: 'DUP_7' });
      await request(app.getHttpServer())
        .post('/api/v1/subjects')
        .set(authHeader(admin.tokens))
        .send({ code: 'DUP_7', name: 'Duplicate', gradeLevels: [7] })
        .expect(409);
    });
  });

  describe('GET /subjects', () => {
    it('returns paginated list matching search + gradeLevel filters', async () => {
      const admin = await seedAdmin();
      await seedSubject(dataSource, { code: 'MATH_X', name: 'Mathematics', gradeLevels: [5, 6] });
      await seedSubject(dataSource, { code: 'ART_X', name: 'Art', gradeLevels: [7] });

      const bySearch = await request(app.getHttpServer())
        .get('/api/v1/subjects?search=math')
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(bySearch.body.data).toHaveLength(1);
      expect(bySearch.body.data[0].code).toBe('MATH_X');

      const byGrade = await request(app.getHttpServer())
        .get('/api/v1/subjects?gradeLevel=5')
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(byGrade.body.data.map((s: { code: string }) => s.code)).toEqual(['MATH_X']);
    });
  });

  describe('PATCH / DELETE /subjects/:id', () => {
    it('PATCH changes name but not code (OmitType)', async () => {
      const admin = await seedAdmin();
      const subj = await seedSubject(dataSource, { code: 'EDIT_7', name: 'Before' });
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/subjects/${subj.id}`)
        .set(authHeader(admin.tokens))
        .send({ name: 'After', defaultHoursPerWeek: 3 })
        .expect(200);
      expect(res.body.name).toBe('After');
      expect(res.body.code).toBe('EDIT_7');
    });

    it('DELETE as MANAGER returns 403', async () => {
      const manager = await seedManager();
      const subj = await seedSubject(dataSource);
      await request(app.getHttpServer())
        .delete(`/api/v1/subjects/${subj.id}`)
        .set(authHeader(manager.tokens))
        .expect(403);
    });

    it('DELETE as ADMIN returns 204 and subsequent GET returns 404', async () => {
      const admin = await seedAdmin();
      const subj = await seedSubject(dataSource);
      await request(app.getHttpServer())
        .delete(`/api/v1/subjects/${subj.id}`)
        .set(authHeader(admin.tokens))
        .expect(204);
      await request(app.getHttpServer())
        .get(`/api/v1/subjects/${subj.id}`)
        .set(authHeader(admin.tokens))
        .expect(404);
    });
  });

  describe('POST /classes/:classId/subjects', () => {
    it('assigns subject + teacher; subsequent duplicate returns 409', async () => {
      const admin = await seedAdmin();
      const teacher = await seedTeacher('teacher.assign@example.com');
      const cls = await seedClass(dataSource, { gradeLevel: 6 });
      const subj = await seedSubject(dataSource, { gradeLevels: [6] });

      const body = {
        subjectId: subj.id,
        teacherId: teacher.id,
        hoursPerWeek: 3,
        academicYear: '2025-2026',
      };

      const res = await request(app.getHttpServer())
        .post(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .send(body)
        .expect(201);
      expect(res.body.subject.id).toBe(subj.id);
      expect(res.body.teacher.id).toBe(teacher.id);

      await request(app.getHttpServer())
        .post(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .send(body)
        .expect(409);
    });

    it('returns 400 when teacherId belongs to a non-TEACHER user', async () => {
      const admin = await seedAdmin();
      const nonTeacher = await seedUser(dataSource, {
        email: 'fake-teacher@example.com',
        password: 'password-long-enough',
        role: RoleName.MANAGER,
      });
      const cls = await seedClass(dataSource, { gradeLevel: 6 });
      const subj = await seedSubject(dataSource, { gradeLevels: [6] });

      await request(app.getHttpServer())
        .post(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .send({
          subjectId: subj.id,
          teacherId: nonTeacher.id,
          academicYear: '2025-2026',
        })
        .expect(400);
    });
  });

  describe('GET /classes/:classId/subjects — TEACHER scoping', () => {
    it('returns only rows where the caller is the teacher', async () => {
      const admin = await seedAdmin();
      const teacherA = await seedTeacher('teacher-a@example.com');
      const teacherB = await seedTeacher('teacher-b@example.com');
      const cls = await seedClass(dataSource, { gradeLevel: 6 });
      const subj1 = await seedSubject(dataSource, { code: 'S_ONE', gradeLevels: [6] });
      const subj2 = await seedSubject(dataSource, { code: 'S_TWO', gradeLevels: [6] });

      // admin assigns one subject to each teacher
      await request(app.getHttpServer())
        .post(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .send({
          subjectId: subj1.id,
          teacherId: teacherA.id,
          academicYear: '2025-2026',
        })
        .expect(201);
      await request(app.getHttpServer())
        .post(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .send({
          subjectId: subj2.id,
          teacherId: teacherB.id,
          academicYear: '2025-2026',
        })
        .expect(201);

      // teacherA sees only row with subj1
      const aList = await request(app.getHttpServer())
        .get(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(teacherA.tokens))
        .expect(200);
      expect(aList.body).toHaveLength(1);
      expect(aList.body[0].subject.id).toBe(subj1.id);

      // admin sees both
      const adminList = await request(app.getHttpServer())
        .get(`/api/v1/classes/${cls.id}/subjects`)
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(adminList.body).toHaveLength(2);
    });
  });
});
