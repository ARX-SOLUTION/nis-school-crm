import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EVENT_PAYMENT_RECORDED } from '../../../common/events/contracts';
import { EventBusService } from '../../../common/events/event-bus.service';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymeService } from './payme.service';

describe('PaymeService', () => {
  let service: PaymeService;
  let mockTransRepo: Record<string, jest.Mock>;
  let mockPaymentRepo: Record<string, jest.Mock>;
  let mockStudentRepo: Record<string, jest.Mock>;
  let mockManager: Record<string, jest.Mock>;
  let mockDataSource: Record<string, jest.Mock>;
  let mockEventBus: Record<string, jest.Mock>;

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
      find: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'trans-uuid-1', createdAt: new Date() })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || 'trans-uuid-1' })),
      update: jest.fn(),
    };

    mockPaymentRepo = {
      create: jest.fn((dto) => ({ ...dto, id: 'payment-uuid-1' })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: 'payment-uuid-1' })),
      update: jest.fn(),
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
      update: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(async (cb) => cb(mockManager)),
    };

    mockEventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymeService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(PaymentTransaction), useValue: mockTransRepo },
        { provide: getRepositoryToken(PaymentRecord), useValue: mockPaymentRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<PaymeService>(PaymeService);
  });

  describe('CheckPerformTransaction', () => {
    it('returns allow: true when student exists and amount > 0', async () => {
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);

      const res = await service.handleRpc({
        method: 'CheckPerformTransaction',
        params: {
          amount: 250000000,
          account: { student_code: 'STD-001' },
        },
        id: 1,
      });

      expect(res.error).toBeUndefined();
      expect(res.result?.allow).toBe(true);
      const detail = res.result?.detail as { items?: unknown[] } | undefined;
      expect(detail?.items).toHaveLength(1);
    });

    it('returns error -31050 if student not found', async () => {
      mockStudentRepo.findOne.mockResolvedValue(null);

      const res = await service.handleRpc({
        method: 'CheckPerformTransaction',
        params: {
          amount: 250000000,
          account: { student_code: 'NON_EXISTENT' },
        },
        id: 2,
      });

      expect(res.error?.code).toBe(-31050);
    });

    it('returns error -31001 if amount is non-positive', async () => {
      const res = await service.handleRpc({
        method: 'CheckPerformTransaction',
        params: {
          amount: 0,
          account: { student_code: 'STD-001' },
        },
        id: 3,
      });

      expect(res.error?.code).toBe(-31001);
    });
  });

  describe('CreateTransaction', () => {
    it('creates new transaction with state 1 inside database transaction', async () => {
      mockManager.findOne.mockResolvedValue(null);
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);

      const res = await service.handleRpc({
        method: 'CreateTransaction',
        params: {
          id: 'payme-12345',
          time: 1700000000000,
          amount: 250000000,
          account: { student_code: 'STD-001' },
        },
        id: 4,
      });

      expect(res.error).toBeUndefined();
      expect(res.result?.state).toBe(1);
      expect(res.result?.create_time).toBe(1700000000000);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(
        PaymentTransaction,
        expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
      );
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('returns existing transaction if already created', async () => {
      const now = Date.now();
      mockManager.findOne.mockResolvedValue({
        id: 'trans-uuid-existing',
        providerTransId: 'payme-12345',
        state: 1,
        meta: { time: now - 1000 },
        createdAt: new Date(now - 1000),
      });

      const res = await service.handleRpc({
        method: 'CreateTransaction',
        params: {
          id: 'payme-12345',
          time: now,
          amount: 250000000,
          account: { student_code: 'STD-001' },
        },
        id: 5,
      });

      expect(res.result?.transaction).toBe('trans-uuid-existing');
      expect(res.result?.state).toBe(1);
    });

    it('handles concurrent duplicate key violation (23505) idempotently', async () => {
      const now = Date.now();
      mockStudentRepo.findOne.mockResolvedValue(mockStudent);

      // Simulate concurrent duplicate transaction throwing Postgres 23505
      mockDataSource.transaction.mockRejectedValueOnce({ code: '23505' });
      mockTransRepo.findOne.mockResolvedValue({
        id: 'trans-uuid-concurrent',
        providerTransId: 'payme-12345',
        state: 1,
        meta: { time: now },
        createdAt: new Date(now),
      });

      const res = await service.handleRpc({
        method: 'CreateTransaction',
        params: {
          id: 'payme-12345',
          time: now,
          amount: 250000000,
          account: { student_code: 'STD-001' },
        },
        id: 55,
      });

      expect(res.result?.transaction).toBe('trans-uuid-concurrent');
      expect(res.result?.state).toBe(1);
    });
  });

  describe('PerformTransaction', () => {
    it('performs transaction, creates payment record and publishes event post-commit', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'trans-uuid-1',
        providerTransId: 'payme-12345',
        studentId: 'student-uuid-1',
        studentCode: 'STD-001',
        student: mockStudent,
        amount: 2500000,
        state: 1,
        meta: { time: Date.now() },
        createdAt: new Date(),
      });

      const res = await service.handleRpc({
        method: 'PerformTransaction',
        params: { id: 'payme-12345' },
        id: 6,
      });

      expect(res.error).toBeUndefined();
      expect(res.result?.state).toBe(2);
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
          method: 'PAYME',
        }),
      );
    });

    it('is idempotent when already in state 2 and does not duplicate payments or events', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'trans-uuid-1',
        providerTransId: 'payme-12345',
        state: 2,
        performTime: new Date(1700000500000),
      });

      const res = await service.handleRpc({
        method: 'PerformTransaction',
        params: { id: 'payme-12345' },
        id: 7,
      });

      expect(res.result?.state).toBe(2);
      expect(res.result?.perform_time).toBe(1700000500000);
      expect(mockManager.create).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('CancelTransaction', () => {
    it('cancels state 1 transaction to state -1 with pessimistic lock', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'trans-uuid-1',
        state: 1,
      });

      const res = await service.handleRpc({
        method: 'CancelTransaction',
        params: { id: 'payme-12345', reason: 1 },
        id: 8,
      });

      expect(res.result?.state).toBe(-1);
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockManager.findOne).toHaveBeenCalledWith(
        PaymentTransaction,
        expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
      );
      expect(mockManager.save).toHaveBeenCalled();
    });

    it('cancels state 2 transaction to state -2 and refunds payment', async () => {
      mockManager.findOne.mockResolvedValue({
        id: 'trans-uuid-1',
        state: 2,
        paymentRecordId: 'payment-uuid-1',
      });

      const res = await service.handleRpc({
        method: 'CancelTransaction',
        params: { id: 'payme-12345', reason: 2 },
        id: 9,
      });

      expect(res.result?.state).toBe(-2);
      expect(mockManager.update).toHaveBeenCalledWith(
        PaymentRecord,
        { id: 'payment-uuid-1' },
        { status: 'REFUNDED' },
      );
    });
  });
});
