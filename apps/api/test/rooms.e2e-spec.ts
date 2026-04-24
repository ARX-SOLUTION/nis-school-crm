import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { RoleName } from '../src/common/enums/role.enum';
import { bootstrapTestApp, resetDatabase } from './helpers/bootstrap-test-app';
import { seedAndLogin, seedRoom, authHeader } from './helpers/fixtures';

describe('Rooms (e2e)', () => {
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

  describe('POST /rooms', () => {
    it('ADMIN creates a room with default type=CLASSROOM', async () => {
      const admin = await seedAdmin();
      const res = await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set(authHeader(admin.tokens))
        .send({ roomNumber: '201' })
        .expect(201);
      expect(res.body).toMatchObject({
        roomNumber: '201',
        type: 'CLASSROOM',
        capacity: 30,
        isActive: true,
      });
    });

    it('MANAGER cannot create a room (403)', async () => {
      const manager = await seedManager();
      await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set(authHeader(manager.tokens))
        .send({ roomNumber: '202' })
        .expect(403);
    });

    it('returns 409 for duplicate room_number', async () => {
      const admin = await seedAdmin();
      await seedRoom(dataSource, { roomNumber: 'DUP-1' });
      await request(app.getHttpServer())
        .post('/api/v1/rooms')
        .set(authHeader(admin.tokens))
        .send({ roomNumber: 'DUP-1' })
        .expect(409);
    });
  });

  describe('GET /rooms filters', () => {
    it('filters by type and active flag', async () => {
      const admin = await seedAdmin();
      await seedRoom(dataSource, { roomNumber: 'L-1', type: 'LAB' });
      await seedRoom(dataSource, { roomNumber: 'C-1', type: 'CLASSROOM' });
      await seedRoom(dataSource, { roomNumber: 'OFF-1', type: 'CLASSROOM', isActive: false });

      const labs = await request(app.getHttpServer())
        .get('/api/v1/rooms?type=LAB')
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(labs.body.data.map((r: { roomNumber: string }) => r.roomNumber)).toEqual(['L-1']);

      const inactive = await request(app.getHttpServer())
        .get('/api/v1/rooms?active=false')
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(inactive.body.data.map((r: { roomNumber: string }) => r.roomNumber)).toEqual([
        'OFF-1',
      ]);
    });
  });

  describe('PATCH / DELETE /rooms/:id', () => {
    it('ADMIN can PATCH; MANAGER cannot', async () => {
      const admin = await seedAdmin();
      const manager = await seedManager();
      const room = await seedRoom(dataSource, { roomNumber: 'PATCH-1', capacity: 20 });

      await request(app.getHttpServer())
        .patch(`/api/v1/rooms/${room.id}`)
        .set(authHeader(manager.tokens))
        .send({ capacity: 40 })
        .expect(403);

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/rooms/${room.id}`)
        .set(authHeader(admin.tokens))
        .send({ capacity: 40, name: 'Updated' })
        .expect(200);
      expect(res.body.capacity).toBe(40);
      expect(res.body.name).toBe('Updated');
    });

    it('DELETE soft-deletes; subsequent GET returns 404', async () => {
      const admin = await seedAdmin();
      const room = await seedRoom(dataSource);
      await request(app.getHttpServer())
        .delete(`/api/v1/rooms/${room.id}`)
        .set(authHeader(admin.tokens))
        .expect(204);
      await request(app.getHttpServer())
        .get(`/api/v1/rooms/${room.id}`)
        .set(authHeader(admin.tokens))
        .expect(404);
    });
  });

  describe('GET /rooms/:id/availability', () => {
    it('returns the stub payload for a valid date', async () => {
      const admin = await seedAdmin();
      const room = await seedRoom(dataSource);
      const res = await request(app.getHttpServer())
        .get(`/api/v1/rooms/${room.id}/availability?date=2026-04-23`)
        .set(authHeader(admin.tokens))
        .expect(200);
      expect(res.body).toEqual({
        roomId: room.id,
        date: '2026-04-23',
        available: true,
        conflicts: [],
      });
    });

    it('returns 400 when the date query parameter is missing', async () => {
      const admin = await seedAdmin();
      const room = await seedRoom(dataSource);
      await request(app.getHttpServer())
        .get(`/api/v1/rooms/${room.id}/availability`)
        .set(authHeader(admin.tokens))
        .expect(400);
    });
  });

  describe('authentication', () => {
    it('GET /rooms without a token returns 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/rooms').expect(401);
    });
  });
});
