import { ObjectLiteral } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { ClubsService } from './clubs.service';
import { Club } from './entities/club.entity';
import { ClubSchedule } from './entities/club-schedule.entity';
import { ClubEnrollment } from './entities/club-enrollment.entity';
import { ClubAttendance } from './entities/club-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { ClubCategory, ClubStatus, EnrollmentStatus } from '@nis/shared';

describe('ClubsService', () => {
  let service: ClubsService;

  const mockClubRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const mockScheduleRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockEnrollmentRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockAttendanceRepo = {
    createQueryBuilder: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockStudentRepo = {
    findOne: jest.fn(),
  };

  const createMockQueryBuilder = <T extends ObjectLiteral>(
    result: unknown,
  ): SelectQueryBuilder<T> =>
    ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(result),
      getMany: jest.fn().mockResolvedValue(result),
    }) as unknown as SelectQueryBuilder<T>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubsService,
        { provide: getRepositoryToken(Club), useValue: mockClubRepo },
        { provide: getRepositoryToken(ClubSchedule), useValue: mockScheduleRepo },
        { provide: getRepositoryToken(ClubEnrollment), useValue: mockEnrollmentRepo },
        { provide: getRepositoryToken(ClubAttendance), useValue: mockAttendanceRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<ClubsService>(ClubsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return club when found', async () => {
      const mockClub = {
        id: '11111111-1111-1111-1111-111111111111',
        name: "Doira to'garagi",
        category: ClubCategory.MUSIC_PERFORMING,
      };

      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(mockClub));

      const result = await service.findById('11111111-1111-1111-1111-111111111111');
      expect(result).toEqual(mockClub);
    });

    it('should throw NotFoundException when club not found', async () => {
      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(null));

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('enrollStudent', () => {
    const clubId = 'club-uuid-1';
    const studentId = 'student-uuid-1';

    it('should reject enrollment when club is at full capacity', async () => {
      const mockClub = {
        id: clubId,
        status: ClubStatus.ACTIVE,
        capacity: 10,
        minGrade: 1,
        maxGrade: 11,
      };

      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(mockClub));

      mockStudentRepo.findOne.mockResolvedValue({ id: studentId, gradeLevel: 5 });
      mockEnrollmentRepo.findOne.mockResolvedValue(null);
      mockEnrollmentRepo.count.mockResolvedValue(10); // already 10 active

      await expect(service.enrollStudent(clubId, studentId)).rejects.toThrow(BadRequestException);
    });

    it('should reject enrollment when student grade is out of range', async () => {
      const mockClub = {
        id: clubId,
        status: ClubStatus.ACTIVE,
        capacity: 20,
        minGrade: 5,
        maxGrade: 8,
      };

      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(mockClub));

      mockStudentRepo.findOne.mockResolvedValue({ id: studentId, gradeLevel: 2 });

      await expect(service.enrollStudent(clubId, studentId)).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate active enrollment', async () => {
      const mockClub = {
        id: clubId,
        status: ClubStatus.ACTIVE,
        capacity: 20,
        minGrade: 1,
        maxGrade: 11,
      };

      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(mockClub));

      mockStudentRepo.findOne.mockResolvedValue({ id: studentId, gradeLevel: 6 });
      mockEnrollmentRepo.findOne.mockResolvedValue({ id: 'existing-enrollment' });

      await expect(service.enrollStudent(clubId, studentId)).rejects.toThrow(ConflictException);
    });

    it('should successfully enroll student when capacity and grade match', async () => {
      const mockClub = {
        id: clubId,
        status: ClubStatus.ACTIVE,
        capacity: 15,
        minGrade: 1,
        maxGrade: 11,
      };

      mockClubRepo.createQueryBuilder.mockReturnValue(createMockQueryBuilder<Club>(mockClub));

      const mockStudent = { id: studentId, firstName: 'Ali', lastName: 'Valiyev', gradeLevel: 5 };
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);
      mockEnrollmentRepo.findOne.mockResolvedValue(null);
      mockEnrollmentRepo.count.mockResolvedValue(5);

      const newEnrollment = {
        id: 'new-enrollment-id',
        clubId,
        studentId,
        status: EnrollmentStatus.ACTIVE,
      };
      mockEnrollmentRepo.create.mockReturnValue(newEnrollment);
      mockEnrollmentRepo.save.mockResolvedValue(newEnrollment);

      const result = await service.enrollStudent(clubId, studentId);
      expect(result.id).toBe('new-enrollment-id');
      expect(result.student).toEqual(mockStudent);
    });
  });

  describe('checkConflicts', () => {
    it('should detect conflict when times overlap in the same room on the same day', async () => {
      const roomId = 'room-101';
      const dayOfWeek = 1;

      mockScheduleRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder<ClubSchedule>([
          {
            id: 'sched-1',
            dayOfWeek: 1,
            startTime: '15:00',
            endTime: '16:30',
            club: { name: 'Robototexnika' },
          },
        ]),
      );

      // Asking for 16:00 - 17:30 overlaps with 15:00 - 16:30
      const conflict = await service.checkConflicts(roomId, dayOfWeek, '16:00', '17:30');
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.message).toContain('Xona band');
    });

    it('should report no conflict when times do not overlap', async () => {
      const roomId = 'room-101';
      const dayOfWeek = 1;

      mockScheduleRepo.createQueryBuilder.mockReturnValue(
        createMockQueryBuilder<ClubSchedule>([
          {
            id: 'sched-1',
            dayOfWeek: 1,
            startTime: '15:00',
            endTime: '16:30',
            club: { name: 'Robototexnika' },
          },
        ]),
      );

      // Asking for 16:30 - 18:00 does not overlap with 15:00 - 16:30
      const conflict = await service.checkConflicts(roomId, dayOfWeek, '16:30', '18:00');
      expect(conflict.hasConflict).toBe(false);
    });
  });
});
