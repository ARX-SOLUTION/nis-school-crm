import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { DataSource, LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';

export interface IssuedRefreshToken {
  raw: string;
  entity: RefreshToken;
}

interface IssueOptions {
  userId: string;
  familyId?: string;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly ttlSeconds: number;

  constructor(
    @InjectRepository(RefreshToken)
    private readonly tokens: Repository<RefreshToken>,
    @InjectDataSource() private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.ttlSeconds = parseDurationSeconds(config.get<string>('JWT_REFRESH_EXPIRES') ?? '7d');
  }

  static hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  async issue(opts: IssueOptions): Promise<IssuedRefreshToken> {
    const raw = randomBytes(48).toString('base64url');
    const entity = this.tokens.create({
      userId: opts.userId,
      tokenHash: RefreshTokenService.hashToken(raw),
      familyId: opts.familyId ?? randomUUID(),
      expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
      revoked: false,
      revokedAt: null,
      replacedBy: null,
      userAgent: opts.userAgent ?? null,
      ipAddress: opts.ipAddress ?? null,
    });
    const saved = await this.tokens.save(entity);
    return { raw, entity: saved };
  }

  /**
   * Validate the presented token and return the entity. Throws on
   * unknown / expired tokens. If a known token has already been revoked,
   * revoke its entire family (refresh-token reuse defence) before throwing.
   */
  async consume(raw: string): Promise<RefreshToken> {
    const tokenHash = RefreshTokenService.hashToken(raw);
    const entity = await this.tokens.findOne({
      where: { tokenHash },
      relations: { user: true },
    });
    if (!entity) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (entity.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (entity.revoked) {
      // Reuse detection — burn the entire family.
      await this.revokeFamily(entity.familyId);
      throw new UnauthorizedException('Refresh token reused — session revoked');
    }
    return entity;
  }

  /**
   * Atomically issue a new token and revoke the current one in the same
   * transaction. A crash between the two writes would otherwise leave both
   * tokens valid simultaneously, defeating reuse detection.
   */
  async rotate(
    current: RefreshToken,
    opts: { userAgent?: string; ipAddress?: string },
  ): Promise<IssuedRefreshToken> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RefreshToken);
      const raw = randomBytes(48).toString('base64url');
      const next = await repo.save(
        repo.create({
          userId: current.userId,
          tokenHash: RefreshTokenService.hashToken(raw),
          familyId: current.familyId,
          expiresAt: new Date(Date.now() + this.ttlSeconds * 1000),
          revoked: false,
          revokedAt: null,
          replacedBy: null,
          userAgent: opts.userAgent ?? null,
          ipAddress: opts.ipAddress ?? null,
        }),
      );
      await repo.update(
        { id: current.id },
        { revoked: true, revokedAt: new Date(), replacedBy: next.id },
      );
      return { raw, entity: next };
    });
  }

  async revoke(token: RefreshToken): Promise<void> {
    await this.tokens.update({ id: token.id }, { revoked: true, revokedAt: new Date() });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.tokens.update(
      { familyId, revoked: false },
      { revoked: true, revokedAt: new Date() },
    );
  }

  async revokeAllForUser(user: Pick<User, 'id'>): Promise<void> {
    await this.tokens.update(
      { userId: user.id, revoked: false },
      { revoked: true, revokedAt: new Date() },
    );
  }

  /** Housekeeping — purge tokens that have been expired for at least 7 days. */
  async purgeExpired(): Promise<number> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.tokens.delete({ expiresAt: LessThan(cutoff) });
    return result.affected ?? 0;
  }
}

const DURATION_REGEX = /^(\d+)([smhd])$/;
const UNIT_TO_SECONDS: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };

function parseDurationSeconds(input: string): number {
  const match = DURATION_REGEX.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid duration: ${input}`);
  }
  const value = parseInt(match[1] ?? '0', 10);
  const unit = match[2];
  if (!unit || !(unit in UNIT_TO_SECONDS)) {
    throw new Error(`Invalid duration unit: ${input}`);
  }
  return value * UNIT_TO_SECONDS[unit];
}
