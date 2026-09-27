import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
    it('should_create_student_and_mark_lead_enrolled', async () => {
      const existingLead = { ...mockLead };
      leadRepo.findOne.mockResolvedValue(existingLead);
      const mockSavedStudent = { id: 'new-student-id' };
      studentRepo.create.mockReturnValue(mockSavedStudent);
      studentRepo.save.mockResolvedValue(mockSavedStudent);
      leadRepo.save.mockImplementation((l) => Promise.resolve(l));

      const result = await service.convertToStudent('lead-1', {
        birthDate: '2015-04-10',
        gender: 'MALE',
      });

      expect(result.studentId).toBe('new-student-id');
      expect(result.lead.stage).toBe('ENROLLED');
      expect(result.lead.convertedStudentId).toBe('new-student-id');
      expect(studentCodeService.next).toHaveBeenCalled();
    });

    it('should_throw_BadRequestException_if_already_converted', async () => {
      leadRepo.findOne.mockResolvedValue({
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
