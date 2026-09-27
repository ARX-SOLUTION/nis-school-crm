import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { ClickService } from './click.service';

describe('ClickService', () => {
  let service: ClickService;
  let mockTransRepo: Record<string, jest.Mock>;
  let mockPaymentRepo: Record<string, jest.Mock>;
  let mockStudentRepo: Record<string, jest.Mock>;

  const mockStudent = {
    id: 'student-uuid-1',
    studentCode: 'STD-001',
    firstName: 'Ali',
    lastName: 'Valiyev',
    class: { name: '5-A' },
  };

  beforeEach(async () => {
    mockTransRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'trans-uuid-click-1' })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || 'trans-uuid-click-1' }),
      ),
    };

    mockPaymentRepo = {
      create: jest.fn((dto) => ({ ...dto, id: 'payment-uuid-1' })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'payment-uuid-1' })),
    };

    mockStudentRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickService,
        { provide: getRepositoryToken(PaymentTransaction), useValue: mockTransRepo },
        { provide: getRepositoryToken(PaymentRecord), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
      ],
    }).compile();

    service = module.get<ClickService>(ClickService);
  });

  describe('action 0 (Prepare)', () => {
    it('returns error 0 and prepare id when student exists', async () => {
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);
      mockTransRepo.findOne.mockResolvedValue(null);

      const res = await service.handleRequest({
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        amount: 2500000,
        action: 0,
        error: 0,
        sign_time: '2026-09-28 00:00:00',
        sign_string: 'dummy',
      });

      expect(res.error).toBe(0);
      expect(res.merchant_prepare_id).toBe('trans-uuid-click-1');
      expect(mockTransRepo.save).toHaveBeenCalled();
    });

    it('returns error -5 when student is not found', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);

      const res = await service.handleRequest({
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'UNKNOWN',
        amount: 2500000,
        action: 0,
        error: 0,
        sign_time: '2026-09-28 00:00:00',
        sign_string: 'dummy',
      });

      expect(res.error).toBe(-5);
      expect(res.error_note).toBe('User does not exist');
    });
  });

  describe('action 1 (Complete)', () => {
    it('confirms payment, creates payment record and returns success', async () => {
      mockTransRepo.findOne.mockResolvedValue({
        id: 'trans-uuid-click-1',
        providerTransId: '112233',
        studentId: 'student-uuid-1',
        studentCode: 'STD-001',
        amount: 2500000,
        state: 0,
        status: 'PENDING',
      });

      const res = await service.handleRequest({
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        merchant_prepare_id: 'trans-uuid-click-1',
        amount: 2500000,
        action: 1,
        error: 0,
        sign_time: '2026-09-28 00:00:00',
        sign_string: 'dummy',
      });

      expect(res.error).toBe(0);
      expect(res.merchant_confirm_id).toBe('trans-uuid-click-1');
      expect(mockPaymentRepo.save).toHaveBeenCalled();
    });

    it('is idempotent when already completed', async () => {
      mockTransRepo.findOne.mockResolvedValue({
        id: 'trans-uuid-click-1',
        status: 'SUCCESS',
        state: 1,
      });

      const res = await service.handleRequest({
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        amount: 2500000,
        action: 1,
        error: 0,
        sign_time: '2026-09-28 00:00:00',
        sign_string: 'dummy',
      });

      expect(res.error).toBe(0);
      expect(res.error_note).toBe('Already paid');
      expect(mockPaymentRepo.save).not.toHaveBeenCalled();
    });
  });
});
