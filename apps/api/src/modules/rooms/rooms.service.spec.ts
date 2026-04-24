import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './entities/room.entity';
import { RoomsService } from './rooms.service';

const baseRoom = (over: Partial<Room> = {}): Room =>
  ({
    id: 'room-1',
    roomNumber: '201',
    name: 'Main hall',
    capacity: 30,
    type: 'CLASSROOM',
    floor: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as unknown as Room;

function makeQb(results: Room[] = [], total = 0) {
  return {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([results, total]),
  } as unknown as SelectQueryBuilder<Room>;
}

function makeRepo(seed?: Room | null) {
  const qb = makeQb();
  return {
    create: jest.fn((dto) => dto as Room),
    save: jest.fn(async (e) => e as Room),
    findOne: jest.fn().mockResolvedValue(seed ?? null),
    softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => qb),
    __qb: qb,
  } as unknown as Repository<Room> & { __qb: SelectQueryBuilder<Room> };
}

function uniqueViolation() {
  const err = new QueryFailedError('insert', [], new Error('dup'));
  (err as unknown as { code: string }).code = '23505';
  return err;
}

describe('RoomsService', () => {
  describe('create', () => {
    it('persists with defaults filled in', async () => {
      const repo = makeRepo();
      const svc = new RoomsService(repo);
      const dto: CreateRoomDto = { roomNumber: '301' } as CreateRoomDto;
      await svc.create(dto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roomNumber: '301',
          capacity: 30,
          type: 'CLASSROOM',
          isActive: true,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('maps unique violation to ConflictException', async () => {
      const repo = makeRepo();
      (repo.save as jest.Mock).mockRejectedValueOnce(uniqueViolation());
      const svc = new RoomsService(repo);
      await expect(svc.create({ roomNumber: '201' } as CreateRoomDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('list', () => {
    it('applies search, type, and active filters and paginates', async () => {
      const repo = makeRepo();
      const svc = new RoomsService(repo);
      const result = await svc.list({
        page: 1,
        limit: 10,
        search: 'lab',
        type: 'LAB',
        active: true,
      } as RoomsQueryDto);
      expect(repo.__qb.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(r.room_number)'),
        expect.any(Object),
      );
      expect(repo.__qb.andWhere).toHaveBeenCalledWith('r.type = :type', { type: 'LAB' });
      expect(repo.__qb.andWhere).toHaveBeenCalledWith('r.is_active = :active', { active: true });
      expect(result).toBeInstanceOf(PaginatedResponseDto);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when missing', async () => {
      const repo = makeRepo(null);
      const svc = new RoomsService(repo);
      await expect(svc.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the entity when found', async () => {
      const seeded = baseRoom();
      const repo = makeRepo(seeded);
      const svc = new RoomsService(repo);
      expect(await svc.getById('room-1')).toBe(seeded);
    });
  });

  describe('update', () => {
    it('mutates only provided fields', async () => {
      const seeded = baseRoom({ capacity: 20 });
      const repo = makeRepo(seeded);
      const svc = new RoomsService(repo);
      await svc.update('room-1', { capacity: 35 } as UpdateRoomDto);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ capacity: 35 }));
    });

    it('raises 409 on duplicate room_number', async () => {
      const repo = makeRepo(baseRoom());
      (repo.save as jest.Mock).mockRejectedValueOnce(uniqueViolation());
      const svc = new RoomsService(repo);
      await expect(
        svc.update('room-1', { roomNumber: '999' } as UpdateRoomDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('softDelete', () => {
    it('calls repository.softDelete after lookup', async () => {
      const repo = makeRepo(baseRoom());
      const svc = new RoomsService(repo);
      await svc.softDelete('room-1');
      expect(repo.softDelete).toHaveBeenCalledWith({ id: 'room-1' });
    });
  });

  describe('availabilityOn', () => {
    it('returns the stub payload for an existing room', async () => {
      const repo = makeRepo(baseRoom());
      const svc = new RoomsService(repo);
      const result = await svc.availabilityOn('room-1', '2026-04-23');
      expect(result).toEqual({
        roomId: 'room-1',
        date: '2026-04-23',
        available: true,
        conflicts: [],
      });
    });

    it('throws 404 when the room is missing', async () => {
      const repo = makeRepo(null);
      const svc = new RoomsService(repo);
      await expect(svc.availabilityOn('nope', '2026-04-23')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
