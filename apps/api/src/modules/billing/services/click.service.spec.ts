import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as crypto from 'crypto';
import { EVENT_PAYMENT_RECORDED } from '../../../common/events/contracts';
import { EventBusService } from '../../../common/events/event-bus.service';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { ClickRequest, ClickService } from './click.service';

describe('ClickService', () => {
  let service: ClickService;
  let mockTransRepo: Record<string, jest.Mock>;
  let mockPaymentRepo: Record<string, jest.Mock>;
  let mockStudentRepo: Record<string, jest.Mock>;
  let mockManager: Record<string, jest.Mock>;
  let mockDataSource: Record<string, jest.Mock>;
  let mockEventBus: Record<string, jest.Mock>;

  const secretKey = 'test_click_secret';
  const validPrepareUuid = '123e4567-e89b-12d3-a456-426614174000';

  function createSign(dto: Omit<ClickRequest, 'sign_string' | 'error'>): string {
    const raw =
      dto.action === 0
        ? `${dto.click_trans_id}${dto.service_id}${secretKey}${dto.merchant_trans_id}${dto.amount}${dto.action}${dto.sign_time}`
        : `${dto.click_trans_id}${dto.service_id}${secretKey}${dto.merchant_trans_id}${dto.merchant_prepare_id ?? ''}${dto.amount}${dto.action}${dto.sign_time}`;
    return crypto.createHash('md5').update(raw).digest('hex');
  }

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
      create: jest.fn((dto) => ({ ...dto, id: validPrepareUuid })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || validPrepareUuid })),
    };

    mockPaymentRepo = {
      create: jest.fn((dto) => ({ ...dto, id: 'payment-uuid-1' })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'payment-uuid-1' })),
    };

    mockStudentRepo = {
      findOne: jest.fn(),
    };

    mockManager = {
      findOne: jest.fn(),
      create: jest.fn((cls, dto) => ({ ...dto, id: 'payment-uuid-1' })),
      save: jest.fn((clsOrEntity, maybeEntity) => {
        const entity = maybeEntity || clsOrEntity;
        return Promise.resolve({ ...entity, id: entity.id || 'saved-id' });
      }),
    };

    mockDataSource = {
      transaction: jest.fn(async (cb) => cb(mockManager)),
    };

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClickService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(PaymentTransaction), useValue: mockTransRepo },
        { provide: getRepositoryToken(PaymentRecord), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<ClickService>(ClickService);
  });

  describe('Signature & Secret Key Enforcement (INC-05)', () => {
    it('returns error -1 when secretKey is missing', async () => {
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

      expect(res.error).toBe(-1);
      expect(res.error_note).toBe('SIGN CHECK FAILED');
    });

    it('returns error -1 when sign_string does not match', async () => {
      const res = await service.handleRequest(
        {
          click_trans_id: 112233,
          service_id: 12345,
          click_paydoc_id: 5566,
          merchant_trans_id: 'STD-001',
          amount: 2500000,
          action: 0,
          error: 0,
          sign_time: '2026-09-28 00:00:00',
          sign_string: 'invalid_md5_signature',
        },
        secretKey,
      );

      expect(res.error).toBe(-1);
      expect(res.error_note).toBe('SIGN CHECK FAILED');
    });
  });

  describe('action 0 (Prepare)', () => {
    it('returns error 0 and prepare id when student exists and signature is valid', async () => {
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);
      mockTransRepo.findOne.mockResolvedValue(null);

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        amount: 2500000,
        action: 0,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(0);
      expect(res.merchant_prepare_id).toBe(validPrepareUuid);
      expect(mockTransRepo.save).toHaveBeenCalled();
    });

    it('returns error -5 when student is not found', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'UNKNOWN',
        amount: 2500000,
        action: 0,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(-5);
      expect(res.error_note).toBe('User does not exist');
    });

    it('recovers from unique constraint violation 23505 and returns existing transaction idempotently (DEF-06)', async () => {
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);
      // First findOne returns null (simulating concurrent race)
      mockTransRepo.findOne
        .mockResolvedValueOnce(null)
        // Second findOne (after 23505 catch) returns the concurrently saved transaction
        .mockResolvedValueOnce({
          id: validPrepareUuid,
          providerTransId: '112233',
          studentId: mockStudent.id,
          studentCode: mockStudent.studentCode,
          amount: 2500000,
          state: 0,
          status: 'PENDING',
        });

      // Save rejects with Postgres 23505 duplicate key error
      mockTransRepo.save.mockRejectedValueOnce({
        code: '23505',
        detail: 'Key (provider, provider_trans_id)=(CLICK, 112233) already exists.',
      });

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        amount: 2500000,
        action: 0,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(0);
      expect(res.error_note).toBe('Success');
      expect(res.click_trans_id).toBe('112233');
      expect(res.merchant_trans_id).toBe('STD-001');
      expect(res.merchant_prepare_id).toBe(validPrepareUuid);
      expect(mockTransRepo.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('action 1 (Complete)', () => {
    it('confirms payment, creates payment record and publishes event post-commit (DEF-01)', async () => {
      mockManager.findOne.mockResolvedValue({
        id: validPrepareUuid,
        providerTransId: '112233',
        studentId: 'student-uuid-1',
        studentCode: 'STD-001',
        amount: 2500000,
        state: 0,
        status: 'PENDING',
      });

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        merchant_prepare_id: validPrepareUuid,
        amount: 2500000,
        action: 1,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(0);
      expect(res.merchant_confirm_id).toBe(validPrepareUuid);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(
        PaymentTransaction,
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
      expect(mockManager.save).toHaveBeenCalled();
      // DEF-01: Event published after transaction commit
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        EVENT_PAYMENT_RECORDED,
        expect.objectContaining({
          studentId: 'student-uuid-1',
          amount: 2500000,
          method: 'CLICK',
        }),
      );
    });

    it('rejects with error -2 when amount does not match transaction amount (INC-02)', async () => {
      mockManager.findOne.mockResolvedValue({
        id: validPrepareUuid,
        providerTransId: '112233',
        studentId: 'student-uuid-1',
        studentCode: 'STD-001',
        amount: 2500000,
        state: 0,
        status: 'PENDING',
      });

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        merchant_prepare_id: validPrepareUuid,
        amount: 999999, // Mismatched amount
        action: 1,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(-2);
      expect(res.error_note).toBe('Incorrect parameter amount');
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('rejects with error -2 when studentCode does not match transaction (INC-02)', async () => {
      mockManager.findOne.mockResolvedValue({
        id: validPrepareUuid,
        providerTransId: '112233',
        studentId: 'student-uuid-1',
        studentCode: 'STD-001',
        amount: 2500000,
        state: 0,
        status: 'PENDING',
      });

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'OTHER-CODE', // Mismatched studentCode
        merchant_prepare_id: validPrepareUuid,
        amount: 2500000,
        action: 1,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(-2);
      expect(res.error_note).toBe('Incorrect parameter amount');
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('safely handles non-UUID merchant_prepare_id without querying DB by ID (DEF-03)', async () => {
      mockManager.findOne.mockResolvedValue(null);

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        merchant_prepare_id: 'invalid-non-uuid-string',
        amount: 2500000,
        action: 1,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      // Should not query { id: 'invalid-non-uuid-string' }
      expect(mockManager.findOne).not.toHaveBeenCalledWith(
        PaymentTransaction,
        expect.objectContaining({
          where: { id: 'invalid-non-uuid-string' },
        }),
      );
      // Fallback query by providerTransId was made
      expect(mockManager.findOne).toHaveBeenCalledWith(
        PaymentTransaction,
        expect.objectContaining({
          where: { provider: 'CLICK', providerTransId: '112233' },
        }),
      );
      expect(res.error).toBe(-6);
    });

    it('is idempotent when already completed', async () => {
      mockManager.findOne.mockResolvedValue({
        id: validPrepareUuid,
        studentCode: 'STD-001',
        amount: 2500000,
        status: 'SUCCESS',
        state: 1,
      });

      const baseReq = {
        click_trans_id: 112233,
        service_id: 12345,
        click_paydoc_id: 5566,
        merchant_trans_id: 'STD-001',
        merchant_prepare_id: validPrepareUuid,
        amount: 2500000,
        action: 1,
        sign_time: '2026-09-28 00:00:00',
      };
      const signString = createSign(baseReq);

      const res = await service.handleRequest(
        {
          ...baseReq,
          error: 0,
          sign_string: signString,
        },
        secretKey,
      );

      expect(res.error).toBe(0);
      expect(res.error_note).toBe('Already paid');
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });
});
