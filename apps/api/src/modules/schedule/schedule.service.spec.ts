import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateScheduleEntryDto } from './dto/create-schedule-entry.dto';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { ScheduleSubstitution } from './entities/schedule-substitution.entity';
import { ScheduleService } from './schedule.service';

const baseEntry = (over: Partial<ScheduleEntry> = {}): ScheduleEntry =>
  ({
    id: 'entry-1',
    classId: 'class-1',
    subjectId: 'sub-1',
    teacherId: 'teacher-1',
    roomId: 'room-1',
    dayOfWeek: 'MONDAY',
    lessonNumber: 1,
    startTime: '08:30:00',
    endTime: '09:15:00',
    effectiveFrom: '2026-09-01',
    effectiveTo: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    substitutions: [],
    ...over,
  }) as unknown as ScheduleEntry;

const baseSub = (over: Partial<ScheduleSubstitution> = {}): ScheduleSubstitution =>
  ({
    id: 'sub-id-1',
    originalEntryId: 'entry-1',
    substituteTeacherId: 'teacher-2',
    date: '2026-10-15',
    reason: 'Sick leave',
    status: 'CONFIRMED',
    createdById: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as unknown as ScheduleSubstitution;

function makeQb(found: ScheduleEntry | null = null, many: ScheduleEntry[] = []) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(found),
    getMany: jest.fn().mockResolvedValue(many),
  } as unknown as SelectQueryBuilder<ScheduleEntry>;
}

describe('ScheduleService', () => {
  let entryRepo: jest.Mocked<Repository<ScheduleEntry>>;
  let subRepo: jest.Mocked<Repository<ScheduleSubstitution>>;
  let service: ScheduleService;

  beforeEach(() => {
    entryRepo = {
      create: jest.fn((dto) => ({ ...dto }) as ScheduleEntry),
      save: jest.fn(async (e) => e as ScheduleEntry),
      findOne: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(baseEntry()),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<ScheduleEntry>>;

    subRepo = {
      create: jest.fn((dto) => ({ ...dto }) as ScheduleSubstitution),
      save: jest.fn(async (s) => s as ScheduleSubstitution),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<ScheduleSubstitution>>;

    service = new ScheduleService(entryRepo, subRepo);
  });

  describe('list', () => {
    it('returns schedule entries with filters applied', async () => {
      const qb = makeQb(null, [baseEntry()]);
      entryRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.list({ classId: 'class-1', dayOfWeek: 'MONDAY' });
      expect(result).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('entry.classId = :classId', { classId: 'class-1' });
      expect(qb.andWhere).toHaveBeenCalledWith('entry.dayOfWeek = :dayOfWeek', {
        dayOfWeek: 'MONDAY',
      });
    });
  });

  describe('getById', () => {
    it('returns entry when found', async () => {
      const entry = baseEntry();
      entryRepo.findOne.mockResolvedValue(entry);

      const result = await service.getById('entry-1');
      expect(result).toBe(entry);
    });

    it('throws NotFoundException when entry does not exist', async () => {
      entryRepo.findOne.mockResolvedValue(null);

      await expect(service.getById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const validDto: CreateScheduleEntryDto = {
      classId: 'class-1',
      subjectId: 'sub-1',
      teacherId: 'teacher-1',
      roomId: 'room-1',
      dayOfWeek: 'MONDAY',
      lessonNumber: 1,
      startTime: '08:30:00',
      endTime: '09:15:00',
      effectiveFrom: '2026-09-01',
      isActive: true,
    };

    it('creates schedule entry when there are no conflicts', async () => {
      const qb = makeQb(null);
      entryRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.create(validDto);
      expect(result.classId).toBe(validDto.classId);
      expect(entryRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException when room is already occupied', async () => {
      const qb = makeQb(baseEntry({ roomId: 'room-1' }));
      entryRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.create(validDto)).rejects.toThrow(
        new ConflictException('Room is already occupied for this period on this day'),
      );
    });

    it('throws ConflictException when teacher is already booked', async () => {
      // Room check returns null, teacher check returns conflict
      let callCount = 0;
      entryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeQb(null); // room check
        return makeQb(baseEntry({ teacherId: 'teacher-1' })); // teacher check
      });

      await expect(service.create(validDto)).rejects.toThrow(
        new ConflictException('Teacher is already scheduled for another class during this period'),
      );
    });

    it('throws ConflictException when class already has a lesson', async () => {
      let callCount = 0;
      entryRepo.createQueryBuilder.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return makeQb(null); // room check
        if (callCount === 2) return makeQb(null); // teacher check
        return makeQb(baseEntry({ classId: 'class-1' })); // class check
      });

      await expect(service.create(validDto)).rejects.toThrow(
        new ConflictException('Class already has a scheduled lesson during this period'),
      );
    });
  });

  describe('createSubstitution', () => {
    const subDto: CreateSubstitutionDto = {
      originalEntryId: 'entry-1',
      substituteTeacherId: 'teacher-2',
      date: '2026-10-15',
      reason: 'Doctor appointment',
    };

    it('creates a substitution when valid', async () => {
      entryRepo.findOne.mockResolvedValue(baseEntry());
      subRepo.findOne.mockResolvedValue(null);

      const result = await service.createSubstitution(subDto, 'admin-user');
      expect(result.originalEntryId).toBe('entry-1');
      expect(result.substituteTeacherId).toBe('teacher-2');
      expect(result.status).toBe('CONFIRMED');
      expect(subRepo.save).toHaveBeenCalled();
    });

    it('throws ConflictException if confirmed substitution already exists on the date', async () => {
      entryRepo.findOne.mockResolvedValue(baseEntry());
      subRepo.findOne.mockResolvedValue(baseSub({ status: 'CONFIRMED' }));

      await expect(service.createSubstitution(subDto, 'admin-user')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('cancelSubstitution', () => {
    it('cancels an existing substitution', async () => {
      const sub = baseSub({ status: 'CONFIRMED' });
      subRepo.findOne.mockResolvedValue(sub);

      const result = await service.cancelSubstitution('sub-id-1');
      expect(result.status).toBe('CANCELLED');
      expect(subRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException if substitution not found', async () => {
      subRepo.findOne.mockResolvedValue(null);

      await expect(service.cancelSubstitution('unknown')).rejects.toThrow(NotFoundException);
    });
  });
});
