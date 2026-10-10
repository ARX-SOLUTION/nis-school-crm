import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../common/redis/redis.constants';
import { getCurrentTashkentMonth } from '../../common/utils/timezone.util';
import { RefreshTokenService } from '../auth/services/refresh-token.service';
import { ParentInviteService } from '../parents/services/parent-invite.service';
import { BillingService } from '../billing/billing.service';

export interface PurgeTokensResult {
  purgedRefreshTokens: number;
  cleanedInvites: number;
  skipped?: boolean;
}

export interface RecalculateDebtorsResult {
  debtorCount: number;
  month: string;
  skipped?: boolean;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly refreshTokenService: RefreshTokenService,
    private readonly parentInviteService: ParentInviteService,
    private readonly billingService: BillingService,
    @Optional() @Inject(REDIS_CLIENT) private readonly redis?: Redis,
  ) {}

  private async acquireRunLock(jobName: string, suffix: string, ttlMs: number): Promise<boolean> {
    if (!this.redis) {
      return true;
    }
    try {
      const lockKey = `cron:${jobName}:${suffix}`;
      const result = await this.redis.set(lockKey, '1', 'PX', ttlMs, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.warn(
        `Redis lock check failed for ${jobName} (${(err as Error).message}); proceeding without lock`,
      );
      return true;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Tashkent' })
  async purgeExpiredTokens(force = false): Promise<PurgeTokensResult> {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(
      new Date(),
    );
    if (!force) {
      const acquired = await this.acquireRunLock('purge-expired', today, 20 * 60 * 60 * 1000);
      if (!acquired) {
        this.logger.log(
          `Skipping daily purgeExpiredTokens: already executed for ${today} by another replica`,
        );
        return { purgedRefreshTokens: 0, cleanedInvites: 0, skipped: true };
      }
    }

    this.logger.log('Starting daily token and invite cleanup...');
    const purgedRefreshTokens = await this.refreshTokenService.purgeExpired();
    const cleanedInvites = await this.parentInviteService.cleanupExpiredInvites();
    this.logger.log(
      `Daily cleanup completed: purged ${purgedRefreshTokens} refresh tokens, cleaned ${cleanedInvites} expired invites`,
    );
    return { purgedRefreshTokens, cleanedInvites };
  }

  @Cron('0 0 1 * *', { timeZone: 'Asia/Tashkent' })
  async recalculateMonthlyDebtors(force = false): Promise<RecalculateDebtorsResult> {
    const targetMonth = getCurrentTashkentMonth();
    if (!force) {
      const acquired = await this.acquireRunLock(
        'recalculate-debtors',
        targetMonth,
        25 * 24 * 60 * 60 * 1000,
      );
      if (!acquired) {
        this.logger.log(
          `Skipping monthly recalculateMonthlyDebtors: already executed for ${targetMonth} by another replica`,
        );
        return { debtorCount: 0, month: targetMonth, skipped: true };
      }
    }

    this.logger.log(`Starting monthly debtor recalculation for ${targetMonth}...`);
    const stats = await this.billingService.getStats(targetMonth);
    this.logger.log(
      `Monthly debtor recalculation completed for ${stats.month}: ${stats.debtorCount} debtors found, collection rate ${stats.collectionRate}%`,
    );
    return { debtorCount: stats.debtorCount, month: stats.month };
  }
}
