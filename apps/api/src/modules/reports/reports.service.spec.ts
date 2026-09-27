import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { GradeRecord } from '../grades/entities/grade.entity';
import { Student } from '../students/entities/student.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ReportsService } from './reports.service';

const mockQb = (raw: unknown[] = [], manyAndCount?: [unknown[], number]) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  addGroupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getRawMany: jest.fn().mockResolvedValue(raw),
  getRawOne: jest.fn().mockResolvedValue({ totalCollected: '0', paymentCount: '0' }),
  getManyAndCount: jest.fn().mockResolvedValue(manyAndCount ?? [[], 0]),
  getMany: jest.fn().mockResolvedValue([]),
});

describe('ReportsService', () => {
  let service: ReportsService;

  const makeRepo = (qbRows: unknown[] = []) => ({
    createQueryBuilder: jest.fn(() => mockQb(qbRows)),
    count: jest.fn().mockResolvedValue(10),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  });

  beforeEach(async () => {
    const classRepoMock = {
      createQueryBuilder: jest.fn(() => ({
        ...mockQb(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest
          .fn()
          .mockResolvedValue([{ id: 'cls-1', name: '7-A', gradeLevel: 7, isActive: true }]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: getRepositoryToken(AttendanceRecord), useValue: makeRepo([]) },
        { provide: getRepositoryToken(ClassEntity), useValue: classRepoMock },
        { provide: getRepositoryToken(GradeRecord), useValue: makeRepo([]) },
        { provide: getRepositoryToken(PaymentRecord), useValue: makeRepo([]) },
        { provide: getRepositoryToken(Student), useValue: makeRepo([]) },
        { provide: getRepositoryToken(Subject), useValue: makeRepo([]) },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAttendanceReport returns array with class data', async () => {
    const result = await service.getAttendanceReport({ month: '2026-09' });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].className).toBe('7-A');
    expect(result[0].month).toBe('2026-09');
    expect(result[0].attendanceRate).toBe(100);
  });

  it('getGradesReport returns subjects and topStudents arrays', async () => {
    const result = await service.getGradesReport({});
    expect(result).toHaveProperty('subjects');
    expect(result).toHaveProperty('topStudents');
    expect(Array.isArray(result.subjects)).toBe(true);
    expect(Array.isArray(result.topStudents)).toBe(true);
  });

  it('getFinanceReport returns 6 months by default', async () => {
    const result = await service.getFinanceReport({ months: 6 });
    expect(result.months.length).toBe(6);
    expect(result).toHaveProperty('totalCollectedPeriod');
    expect(result).toHaveProperty('averageMonthlyRevenue');
    expect(result.totalCollectedPeriod).toBe(0);
  });

  it('getFinanceReport caps at 12 months max', async () => {
    const result = await service.getFinanceReport({ months: 99 });
    expect(result.months.length).toBe(12);
  });
});
