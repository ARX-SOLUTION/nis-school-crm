import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';

interface Built {
  service: RefreshTokenService;
  repo: jest.Mocked<Repository<RefreshToken>>;
  txRepo: jest.Mocked<Repository<RefreshToken>>;
}

const buildService = (): Built => {
  const repo = {
    create: jest.fn((data) => data as RefreshToken),
    save: jest.fn(async (entity) => ({ id: 'token-id', ...entity }) as RefreshToken),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
  } as unknown as jest.Mocked<Repository<RefreshToken>>;

  const txRepo = {
    create: jest.fn((data) => data as RefreshToken),
    save: jest.fn(async (entity) => ({ id: 'next-id', ...entity }) as RefreshToken),
    update: jest.fn(),
  } as unknown as jest.Mocked<Repository<RefreshToken>>;

  const dataSource = {
    transaction: jest.fn(async (cb: (manager: EntityManager) => Promise<unknown>) => {
      const manager = { getRepository: () => txRepo } as unknown as EntityManager;
      return cb(manager);
    }),
  } as unknown as DataSource;

  const config = {
    get: jest.fn((key: string) => (key === 'JWT_REFRESH_EXPIRES' ? '7d' : undefined)),
  } as unknown as ConfigService;

  return { service: new RefreshTokenService(repo, dataSource, config), repo, txRepo };
};

describe('RefreshTokenService', () => {
  it('should_hash_with_sha256_hex', () => {
    const hash = RefreshTokenService.hashToken('token-abc');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(RefreshTokenService.hashToken('token-abc')).toBe(hash);
  });

  it('should_issue_a_token_and_persist_a_hash', async () => {
    const { service, repo } = buildService();
    const result = await service.issue({ userId: 'user-1' });
    expect(result.raw).toBeTruthy();
    expect(result.raw.length).toBeGreaterThan(40);
    const saved = repo.save.mock.calls[0]?.[0] as RefreshToken;
    expect(saved.tokenHash).toBe(RefreshTokenService.hashToken(result.raw));
    expect(saved.userId).toBe('user-1');
    expect(saved.familyId).toBeTruthy();
  });

  it('should_reject_unknown_token', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(service.consume('totally-fake')).rejects.toThrow(UnauthorizedException);
  });

  it('should_reject_expired_token', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue({
      id: 't1',
      tokenHash: 'h',
      familyId: 'f',
      expiresAt: new Date(Date.now() - 1000),
      revoked: false,
    } as RefreshToken);
    await expect(service.consume('raw')).rejects.toThrow(/expired/i);
  });

  it('should_burn_family_when_revoked_token_is_reused', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue({
      id: 't1',
      tokenHash: 'h',
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revoked: true,
    } as RefreshToken);
    await expect(service.consume('raw')).rejects.toThrow(/reused/i);
    expect(repo.update).toHaveBeenCalledWith(
      { familyId: 'family-1', revoked: false },
      expect.objectContaining({ revoked: true }),
    );
  });

  it('should_rotate_atomically_keeping_family_and_linking_replacement', async () => {
    const { service, txRepo } = buildService();
    const current = { id: 'curr', userId: 'u1', familyId: 'fam-x' } as RefreshToken;
    const result = await service.rotate(current, {});
    expect(result.raw).toBeTruthy();
    const newToken = txRepo.save.mock.calls[0]?.[0] as RefreshToken;
    expect(newToken.familyId).toBe('fam-x');
    expect(newToken.userId).toBe('u1');
    expect(txRepo.update).toHaveBeenCalledWith(
      { id: 'curr' },
      expect.objectContaining({ revoked: true, replacedBy: 'next-id' }),
    );
  });
});
