import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { BillingService } from './billing.service';
import { PaymentRecord } from './entities/payment.entity';

describe('BillingService', () => {
  let service: BillingService;
  let paymentRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let studentRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    count: jest.Mock;
  };

  const mockStudent = {
    id: 'student-1',
    firstName: 'Shaxzod',
    lastName: 'Karimov',
    studentCode: 'NIS-2026-00001',
    status: StudentStatus.ACTIVE,
    class: { id: 'class-1', name: '5-A' },
  };

  beforeEach(async () => {
    paymentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    studentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(PaymentRecord),
          useValue: paymentRepo,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: studentRepo,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  describe('recordPayment', () => {
    it('should_throw_NotFoundException_when_student_does_not_exist', async () => {
      studentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.recordPayment({
          studentId: 'non-existent',
          amount: 2500000,
          method: 'CASH',
          month: '2026-09',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should_save_and_return_payment_record', async () => {
      studentRepo.findOne.mockResolvedValue(mockStudent);
      const mockSaved = {
        id: 'payment-1',
        studentId: 'student-1',
        amount: 2500000,
        method: 'CASH',
        status: 'CONFIRMED',
        receiptNumber: 'REC-202609-1234',
        month: '2026-09',
        paidAt: new Date('2026-09-28'),
        comment: 'Full tuition',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      paymentRepo.create.mockReturnValue(mockSaved);
      paymentRepo.save.mockResolvedValue(mockSaved);

      const result = await service.recordPayment({
        studentId: 'student-1',
        amount: 2500000,
        method: 'CASH',
        month: '2026-09',
        paidAt: '2026-09-28',
        comment: 'Full tuition',
      });

      expect(result.id).toBe('payment-1');
      expect(result.amount).toBe(2500000);
      expect(result.studentName).toBe('Karimov Shaxzod');
      expect(result.className).toBe('5-A');
    });
  });

  describe('getStats', () => {
    it('should_calculate_correct_stats', async () => {
      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ totalCollected: '5000000' }),
        getRawMany: jest.fn().mockResolvedValue([
          { studentId: 'student-1', totalPaid: '2500000' },
          { studentId: 'student-2', totalPaid: '2500000' },
        ]),
      };
      paymentRepo.createQueryBuilder.mockReturnValue(qb as never);
      studentRepo.count.mockResolvedValue(4);
      studentRepo.find.mockResolvedValue([
        mockStudent,
        { ...mockStudent, id: 'student-2' },
        { ...mockStudent, id: 'student-3' },
        { ...mockStudent, id: 'student-4' },
      ]);

      const stats = await service.getStats('2026-09');

      expect(stats.totalCollectedThisMonth).toBe(5000000);
      expect(stats.expectedThisMonth).toBe(10000000); // 4 * 2.5m
      expect(stats.debtorCount).toBe(2); // student-3 and student-4 have 0 paid
      expect(stats.collectionRate).toBe(50);
    });
  });

  describe('getDebtors', () => {
    it('should_return_students_with_unpaid_or_partial_tuition', async () => {
      studentRepo.find.mockResolvedValue([
        mockStudent,
        { ...mockStudent, id: 'student-2', firstName: 'Aziz' },
      ]);

      const qb = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { studentId: 'student-1', totalPaid: '1500000' }, // 1m debt
        ]),
      };
      paymentRepo.createQueryBuilder.mockReturnValue(qb as never);

      const debtors = await service.getDebtors('2026-09');

      expect(debtors).toHaveLength(2);
      // student-2 has 0 paid -> 2.5m debt (should be sorted first)
      expect(debtors[0].studentId).toBe('student-2');
      expect(debtors[0].debtAmount).toBe(2500000);
      // student-1 has 1.5m paid -> 1m debt
      expect(debtors[1].studentId).toBe('student-1');
      expect(debtors[1].debtAmount).toBe(1000000);
    });
  });
});
