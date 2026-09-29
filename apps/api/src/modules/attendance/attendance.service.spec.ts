import { Repository } from 'typeorm';
import { AttendanceService } from './attendance.service';
import { AttendanceRecord } from './entities/attendance.entity';

describe('AttendanceService', () => {
  let repo: jest.Mocked<Repository<AttendanceRecord>>;
  let service: AttendanceService;

  beforeEach(() => {
    repo = {
      create: jest.fn((dto) => ({ ...dto }) as AttendanceRecord),
      save: jest.fn(async (rec) => rec as AttendanceRecord),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<AttendanceRecord>>;

    service = new AttendanceService(repo);
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
  });
});
