import { Test, TestingModule } from '@nestjs/testing';
import { REDIS_CLIENT } from '../../common/redis/redis.constants';
import { TasksService } from './tasks.service';
import { RefreshTokenService } from '../auth/services/refresh-token.service';
import { ParentInviteService } from '../parents/services/parent-invite.service';
import { BillingService } from '../billing/billing.service';

describe('TasksService', () => {
  let service: TasksService;
  let refreshTokenService: { purgeExpired: jest.Mock };
  let parentInviteService: { cleanupExpiredInvites: jest.Mock };
  let billingService: { getStats: jest.Mock };
  let mockRedis: { set: jest.Mock };

  beforeEach(async () => {
    refreshTokenService = {
      purgeExpired: jest.fn().mockResolvedValue(12),
    };
    parentInviteService = {
      cleanupExpiredInvites: jest.fn().mockResolvedValue(4),
    };
    billingService = {
      getStats: jest.fn().mockResolvedValue({
        month: '2026-10',
        totalCollectedThisMonth: 50000000,
        expectedThisMonth: 100000000,
        debtorCount: 1,
        collectionRate: 50,
      }),
    };
    mockRedis = {
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: RefreshTokenService, useValue: refreshTokenService },
        { provide: ParentInviteService, useValue: parentInviteService },
        { provide: BillingService, useValue: billingService },
        { provide: REDIS_CLIENT, useValue: mockRedis },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should purge expired refresh tokens and cleanup expired invites when lock acquired', async () => {
    const result = await service.purgeExpiredTokens();

    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(refreshTokenService.purgeExpired).toHaveBeenCalledTimes(1);
    expect(parentInviteService.cleanupExpiredInvites).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      purgedRefreshTokens: 12,
      cleanedInvites: 4,
    });
  });

  it('should skip purgeExpiredTokens when lock is held by another replica', async () => {
    mockRedis.set.mockResolvedValueOnce(null);

    const result = await service.purgeExpiredTokens();

    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(refreshTokenService.purgeExpired).not.toHaveBeenCalled();
    expect(parentInviteService.cleanupExpiredInvites).not.toHaveBeenCalled();
    expect(result).toEqual({
      purgedRefreshTokens: 0,
      cleanedInvites: 0,
      skipped: true,
    });
  });

  it('should proceed with purgeExpiredTokens when Redis throws an error', async () => {
    mockRedis.set.mockRejectedValueOnce(new Error('Redis connection lost'));

    const result = await service.purgeExpiredTokens();

    expect(refreshTokenService.purgeExpired).toHaveBeenCalledTimes(1);
    expect(parentInviteService.cleanupExpiredInvites).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      purgedRefreshTokens: 12,
      cleanedInvites: 4,
    });
  });

  it('should recalculate monthly debtors and log billing statistics when lock acquired', async () => {
    const result = await service.recalculateMonthlyDebtors();

    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(billingService.getStats).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      debtorCount: 1,
      month: '2026-10',
    });
  });

  it('should skip recalculateMonthlyDebtors when lock is held by another replica', async () => {
    mockRedis.set.mockResolvedValueOnce(null);

    const result = await service.recalculateMonthlyDebtors();

    expect(mockRedis.set).toHaveBeenCalledTimes(1);
    expect(billingService.getStats).not.toHaveBeenCalled();
    expect(result.skipped).toBe(true);
  });
});
