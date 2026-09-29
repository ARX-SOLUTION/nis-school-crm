import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Student } from '../../students/entities/student.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { ClickService } from '../services/click.service';
import { PaymeService } from '../services/payme.service';
import { PaymentGatewaysController } from './payment-gateways.controller';

describe('PaymentGatewaysController', () => {
  let controller: PaymentGatewaysController;
  let mockPaymeService: Record<string, jest.Mock>;
  let mockClickService: Record<string, jest.Mock>;
  let mockStudentRepo: Record<string, jest.Mock>;
  let mockTransRepo: Record<string, jest.Mock>;
  let mockConfigService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockPaymeService = {
      handleRpc: jest.fn().mockResolvedValue({ result: { allow: true } }),
    };

    mockClickService = {
      handleRequest: jest.fn().mockResolvedValue({ error: 0, error_note: 'Success' }),
    };

    mockStudentRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'student-uuid-1',
        studentCode: 'STD-001',
        firstName: 'Ali',
        lastName: 'Valiyev',
      }),
    };

    mockTransRepo = {
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'PAYME_KEY') return 'secret123';
        if (key === 'CLICK_SECRET_KEY') return 'clickSecret';
        if (key === 'PAYME_MERCHANT_ID') return 'merchant123';
        if (key === 'CLICK_SERVICE_ID') return 'service123';
        if (key === 'CLICK_MERCHANT_ID') return 'merchant456';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentGatewaysController],
      providers: [
        { provide: PaymeService, useValue: mockPaymeService },
        { provide: ClickService, useValue: mockClickService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(PaymentTransaction), useValue: mockTransRepo },
      ],
    }).compile();

    controller = module.get<PaymentGatewaysController>(PaymentGatewaysController);
  });

  it('delegates payme requests to paymeService', async () => {
    const authHeader = `Basic ${Buffer.from('Paycom:secret123').toString('base64')}`;
    const res = await controller.handlePayme(
      { method: 'CheckPerformTransaction', params: {}, id: 1 },
      authHeader,
    );

    expect(res).toEqual({ result: { allow: true } });
    expect(mockPaymeService.handleRpc).toHaveBeenCalled();
  });

  it('delegates click requests to clickService', async () => {
    const res = await controller.handleClick({
      click_trans_id: 1,
      service_id: 2,
      click_paydoc_id: 3,
      merchant_trans_id: 'STD-001',
      amount: 1000,
      action: 0,
      error: 0,
      sign_time: '2026-09-28 00:00:00',
      sign_string: 'dummy',
    });

    expect(res).toEqual({ error: 0, error_note: 'Success' });
    expect(mockClickService.handleRequest).toHaveBeenCalled();
  });

  it('generates payment links for Payme and Click', async () => {
    const res = await controller.getPaymentLink('STD-001', '2500000');

    expect(res.studentCode).toBe('STD-001');
    expect(res.amount).toBe(2500000);
    expect(res.paymeUrl).toContain('checkout.paycom.uz');
    expect(res.clickUrl).toContain('my.click.uz');
  });
});
