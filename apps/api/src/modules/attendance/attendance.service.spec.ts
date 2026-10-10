import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord } from './entities/attendance.entity';

import { EventsGateway } from '../events/events.gateway';

describe('AttendanceService', () => {
  let repo: jest.Mocked<Repository<AttendanceRecord>>;
  let parentRepo: jest.Mocked<Repository<ParentStudent>>;
  let service: AttendanceService;

  beforeEach(() => {
    repo = {
      create: jest.fn((dto) => ({ ...dto }) as AttendanceRecord),
      save: jest.fn(async (rec) => rec as AttendanceRecord),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<AttendanceRecord>>;

    parentRepo = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<ParentStudent>>;

    service = new AttendanceService(
      repo,
      undefined,
      {
        broadcastToRole: jest.fn(),
        broadcastToUser: jest.fn(),
      } as unknown as EventsGateway,
      parentRepo,
    );
  });

  describe('bulkRecord', () => {
    it('creates attendance records for students', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.bulkRecord(
        {
          classId: 'class-1',
          date: '2026-09-28',
          records: [
            { studentId: 'student-1', status: 'PRESENT' },
            { studentId: 'student-2', status: 'ABSENT', remarks: 'Sick' },
          ],
        },
        'teacher-1',
      );

      expect(result).toHaveLength(2);
      expect(repo.save).toHaveBeenCalledTimes(2);
    });

    it('updates existing attendance record if already present', async () => {
      const existing = {
        id: 'rec-1',
        studentId: 'student-1',
        classId: 'class-1',
        date: '2026-09-28',
        status: 'ABSENT',
        remarks: null,
      } as AttendanceRecord;

      repo.findOne.mockResolvedValue(existing);

      const result = await service.bulkRecord(
        {
          classId: 'class-1',
          date: '2026-09-28',
          records: [{ studentId: 'student-1', status: 'PRESENT' }],
        },
        'teacher-1',
      );

      expect(result[0].status).toBe('PRESENT');
    });
  });

  describe('getStats', () => {
    it('calculates attendance statistics correctly', async () => {
      repo.find.mockResolvedValue([
        { status: 'PRESENT' } as AttendanceRecord,
        { status: 'PRESENT' } as AttendanceRecord,
        { status: 'LATE' } as AttendanceRecord,
        { status: 'ABSENT' } as AttendanceRecord,
      ]);

      const stats = await service.getStats('student-1');
      expect(stats.totalDays).toBe(4);
      expect(stats.presentCount).toBe(2);
      expect(stats.lateCount).toBe(1);
      expect(stats.absentCount).toBe(1);
      expect(stats.ratePercentage).toBe(75);
    });

    it('throws ForbiddenException when a PARENT accesses stats for an unlinked student (SEC-01)', async () => {
      parentRepo.findOne.mockResolvedValue(null);
      const parentUser = { id: 'parent-1', role: RoleName.PARENT } as AuthenticatedUser;

      await expect(service.getStats('student-1', parentUser)).rejects.toThrow(ForbiddenException);
    });

    it('allows a PARENT to access stats for their linked child (SEC-01)', async () => {
      parentRepo.findOne.mockResolvedValue({
        id: 'link-1',
        parentUserId: 'parent-1',
        studentId: 'student-1',
      } as ParentStudent);
      repo.find.mockResolvedValue([{ status: 'PRESENT' } as AttendanceRecord]);
      const parentUser = { id: 'parent-1', role: RoleName.PARENT } as AuthenticatedUser;

      const stats = await service.getStats('student-1', parentUser);
      expect(stats.totalDays).toBe(1);
      expect(stats.presentCount).toBe(1);
    });

    it('throws InternalServerErrorException when parentStudents repo is unavailable for PARENT caller (DEF-10)', async () => {
      const serviceWithoutParentRepo = new AttendanceService(repo, undefined, undefined, undefined);
      const parentUser = { id: 'parent-1', role: RoleName.PARENT } as AuthenticatedUser;

      await expect(serviceWithoutParentRepo.getStats('student-1', parentUser)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
