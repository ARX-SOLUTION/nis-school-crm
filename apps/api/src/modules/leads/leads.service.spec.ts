import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClassEntity } from '../classes/entities/class.entity';
import { StudentClassHistory } from '../students/entities/student-class-history.entity';
import { Student } from '../students/entities/student.entity';
import { StudentCodeService } from '../students/services/student-code.service';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';

describe('LeadsService', () => {
  let service: LeadsService;
  let leadRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let studentRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let studentCodeService: {
    next: jest.Mock;
  };
  let mockManager: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    getRepository: jest.Mock;
  };
  let mockDataSource: {
    transaction: jest.Mock;
  };

  const mockLead: Lead = {
    id: 'lead-1',
    fullName: 'Karimov Shaxzod Olimovich',
    phone: '+998901234567',
    parentName: 'Karimov Olim',
    targetGradeLevel: 5,
    source: 'TELEGRAM',
    stage: 'NEW',
    notes: 'Qiziqish bildirdi',
    convertedStudentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockClass = {
    id: 'class-1',
    name: '5-A',
    gradeLevel: 5,
    academicYear: '2026-2027',
    maxStudents: 25,
    isActive: true,
    branchId: 'branch-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as ClassEntity;

  beforeEach(async () => {
    leadRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    studentRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    studentCodeService = {
      next: jest.fn().mockResolvedValue('NIS-2026-00099'),
    };
    mockManager = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((cls, dto) => ({ ...dto, id: 'mock-created-id' })),
      getRepository: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn(async (cb) => cb(mockManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        {
          provide: getRepositoryToken(Lead),
          useValue: leadRepo,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: studentRepo,
        },
        {
          provide: StudentCodeService,
          useValue: studentCodeService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
  });

  describe('create', () => {
    it('should_create_and_save_lead', async () => {
      leadRepo.create.mockReturnValue(mockLead);
      leadRepo.save.mockResolvedValue(mockLead);

      const result = await service.create({
        fullName: 'Karimov Shaxzod Olimovich',
        phone: '+998901234567',
      });

      expect(result.id).toBe('lead-1');
      expect(result.fullName).toBe('Karimov Shaxzod Olimovich');
      expect(result.stage).toBe('NEW');
    });
  });

  describe('updateStage', () => {
    it('should_update_stage_and_append_notes', async () => {
      leadRepo.findOne.mockResolvedValue({ ...mockLead });
      leadRepo.save.mockImplementation((l) => Promise.resolve(l));

      const result = await service.updateStage('lead-1', {
        stage: 'CONTACTED',
        notes: 'Telefon orqali gaplashildi',
      });

      expect(result.stage).toBe('CONTACTED');
      expect(result.notes).toContain('Telefon orqali gaplashildi');
    });

    it('should_throw_NotFoundException_if_not_found', async () => {
      leadRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStage('invalid-id', { stage: 'CONTACTED' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('convertToStudent', () => {
    it('should_create_student_and_mark_lead_enrolled_in_transaction', async () => {
      const existingLead = { ...mockLead };
      mockManager.findOne.mockResolvedValueOnce(existingLead);

      const mockSavedStudent = { id: 'new-student-id' };
      mockManager.save
        .mockResolvedValueOnce(mockSavedStudent) // student save
        .mockResolvedValueOnce({
          ...existingLead,
          stage: 'ENROLLED',
          convertedStudentId: 'new-student-id',
        }); // lead save

      const result = await service.convertToStudent('lead-1', {
        birthDate: '2015-04-10',
        gender: 'MALE',
      });

      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(result.studentId).toBe('new-student-id');
      expect(result.lead.stage).toBe('ENROLLED');
      expect(result.lead.convertedStudentId).toBe('new-student-id');
      expect(studentCodeService.next).toHaveBeenCalled();
    });

    it('should_assign_to_class_and_record_history_when_space_available (DATA-01, DATA-02)', async () => {
      const existingLead = { ...mockLead };
      mockManager.findOne
        .mockResolvedValueOnce(existingLead) // lead find
        .mockResolvedValueOnce(mockClass); // class find with lock

      const mockStudentQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(20), // 20 < 25 maxStudents
      };
      mockManager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockStudentQb),
      });

      const mockSavedStudent = { id: 'new-student-id', classId: 'class-1' };
      mockManager.save
        .mockResolvedValueOnce(mockSavedStudent) // student save
        .mockResolvedValueOnce({ id: 'history-1' }) // class history save
        .mockResolvedValueOnce({
          ...existingLead,
          stage: 'ENROLLED',
          convertedStudentId: 'new-student-id',
        }); // lead save

      const result = await service.convertToStudent('lead-1', {
        birthDate: '2015-04-10',
        gender: 'MALE',
        classId: 'class-1',
      });

      expect(mockManager.findOne).toHaveBeenCalledWith(
        ClassEntity,
        expect.objectContaining({
          where: { id: 'class-1', isActive: true },
          lock: { mode: 'pessimistic_write' },
        }),
      );
      expect(mockManager.save).toHaveBeenCalledWith(
        StudentClassHistory,
        expect.objectContaining({
          studentId: 'new-student-id',
          classId: 'class-1',
        }),
      );
      expect(result.studentId).toBe('new-student-id');
      expect(result.lead.stage).toBe('ENROLLED');
      expect(studentCodeService.next).toHaveBeenCalledWith(2026, mockManager);
    });

    it('should_throw_BadRequestException_when_class_grade_level_mismatches_lead_targetGradeLevel (DEF-12)', async () => {
      const existingLead = { ...mockLead, targetGradeLevel: 5 };
      const mismatchClass = { ...mockClass, gradeLevel: 6 };
      mockManager.findOne.mockResolvedValueOnce(existingLead).mockResolvedValueOnce(mismatchClass);

      await expect(
        service.convertToStudent('lead-1', {
          classId: 'class-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should_throw_BadRequestException_when_class_is_full (DATA-02)', async () => {
      const existingLead = { ...mockLead };
      mockManager.findOne.mockResolvedValueOnce(existingLead).mockResolvedValueOnce(mockClass); // maxStudents = 25

      const mockStudentQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(25), // class already full!
      };
      mockManager.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(mockStudentQb),
      });

      await expect(
        service.convertToStudent('lead-1', {
          classId: 'class-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should_throw_NotFoundException_if_class_not_found', async () => {
      const existingLead = { ...mockLead };
      mockManager.findOne.mockResolvedValueOnce(existingLead).mockResolvedValueOnce(null); // class not found

      await expect(
        service.convertToStudent('lead-1', {
          classId: 'non-existent-class',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should_throw_NotFoundException_if_lead_not_found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.convertToStudent('non-existent', {})).rejects.toThrow(NotFoundException);
    });

    it('should_throw_BadRequestException_if_already_converted', async () => {
      mockManager.findOne.mockResolvedValueOnce({
        ...mockLead,
        convertedStudentId: 'already-converted-id',
      });

      await expect(service.convertToStudent('lead-1', {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStats', () => {
    it('should_calculate_pipeline_counts_and_conversion_rate', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { stage: 'NEW', count: '5' },
          { stage: 'CONTACTED', count: '3' },
          { stage: 'ENROLLED', count: '2' },
        ]),
      };
      leadRepo.createQueryBuilder.mockReturnValue(qb as never);

      const stats = await service.getStats();

      expect(stats.total).toBe(10);
      expect(stats.byStage.NEW).toBe(5);
      expect(stats.byStage.CONTACTED).toBe(3);
      expect(stats.byStage.ENROLLED).toBe(2);
      expect(stats.conversionRate).toBe(20);
    });
  });
});
