import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

import { DataSource, EntityTarget, QueryFailedError } from 'typeorm';
import { EventBusService } from '../../common/events/event-bus.service';
import { RoleName } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

const adminActor = { id: 'admin-1', role: RoleName.ADMIN };
const managerActor = { id: 'mgr-1', role: RoleName.MANAGER };
const superActor = { id: 'sa-1', role: RoleName.SUPER_ADMIN };

const baseUser = (over: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'm@nis.uz',
    passwordHash: 'h',
    fullName: 'M',
    phone: null,
    role: RoleName.MANAGER,
    telegramChatId: null,
    telegramUsername: null,
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as unknown as User;

interface Built {
  service: UsersService;
  repo: {
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    softDelete: jest.Mock;
  };
  publish: jest.Mock;
  txUserRepo: { create: jest.Mock; save: jest.Mock };
  getRepositoryArg: jest.Mock;
}

const buildService = (overrides?: { txError?: unknown }): Built => {
  const txUserRepo = {
    create: jest.fn((data) => data as User),
    save: jest.fn(async (entity) => ({ id: 'new-user-id', ...entity }) as User),
  };
  const getRepositoryArg = jest.fn((target: EntityTarget<unknown>) => {
    void target;
    return txUserRepo;
  });
  const dataSource = {
    transaction: jest.fn(async (cb: (m: { getRepository: jest.Mock }) => Promise<User>) => {
      if (overrides?.txError) throw overrides.txError;
      return cb({ getRepository: getRepositoryArg });
    }),
  } as unknown as DataSource;

  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const repo = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    save: jest.fn(async (entity) => entity as User),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const publish = jest.fn();
  const eventBus = { publish } as unknown as EventBusService;
  const config = {
    getOrThrow: jest.fn().mockReturnValue(12),
  } as unknown as ConfigService;

  return {
    service: new UsersService(repo as never, dataSource, eventBus, config),
    repo,
    publish,
    txUserRepo,
    getRepositoryArg,
  };
};

afterEach(() => jest.clearAllMocks());

describe('UsersService.create', () => {
  const dto = (over: Partial<CreateUserDto> = {}): CreateUserDto => ({
    email: 'new@nis.uz',
    fullName: 'New',
    role: RoleName.MANAGER,
    ...over,
  });

  it('should_reject_super_admin_creation', async () => {
    const { service } = buildService();
    await expect(service.create(superActor, dto({ role: RoleName.SUPER_ADMIN }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should_reject_when_actor_role_cannot_create_target', async () => {
    const { service } = buildService();
    await expect(service.create(managerActor, dto({ role: RoleName.MANAGER }))).rejects.toThrow(
      /MANAGER cannot create/,
    );
  });

  it('should_translate_unique_violation_to_conflict_exception', async () => {
    const driverError = Object.assign(new Error('duplicate'), { code: '23505' });
    const txError = new QueryFailedError('insert into users', [], driverError);
    const { service } = buildService({ txError });
    await expect(service.create(adminActor, dto())).rejects.toThrow(ConflictException);
  });

  it('should_persist_user_and_publish_user_created_event', async () => {
    const { service, publish } = buildService();
    const result = await service.create(adminActor, dto());
    expect(result.user.id).toBe('new-user-id');
    expect(result.generatedPassword.length).toBeGreaterThanOrEqual(14);
    expect(publish).toHaveBeenCalledTimes(1);
    const [routingKey, event] = publish.mock.calls[0] as [string, { generatedPassword: string }];
    expect(routingKey).toBe('user.created');
    expect(event.generatedPassword).toBe(result.generatedPassword);
  });

  it('should_run_extra_callback_inside_same_transaction_with_user_repo', async () => {
    const { service, txUserRepo, getRepositoryArg } = buildService();
    const extra = jest.fn().mockResolvedValue(undefined);
    await service.create(adminActor, dto(), extra);
    expect(extra).toHaveBeenCalled();
    expect(txUserRepo.save).toHaveBeenCalled();
    expect(getRepositoryArg).toHaveBeenCalledWith(User);
  });

  it('should_swallow_publish_failure_so_http_request_still_succeeds', async () => {
    const { service, publish } = buildService();
    publish.mockRejectedValueOnce(new Error('rabbit down'));
    const result = await service.create(adminActor, dto());
    expect(result.user.id).toBe('new-user-id');
  });
});

describe('UsersService.list', () => {
  it('should_apply_pagination_filters_and_return_meta', async () => {
    const { service, repo } = buildService();
    const qb = repo.createQueryBuilder();
    qb.getManyAndCount.mockResolvedValueOnce([[baseUser()], 1]);
    const query: UsersQueryDto = { page: 1, limit: 20 };
    const result = await service.list(query);
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
  });

  it('should_return_zero_total_pages_for_empty_list', async () => {
    const { service } = buildService();
    const query: UsersQueryDto = { page: 1, limit: 20 };
    const result = await service.list(query);
    expect(result.meta.totalPages).toBe(0);
  });

  it('should_escape_like_metacharacters_in_search', async () => {
    const { service, repo } = buildService();
    const qb = repo.createQueryBuilder();
    qb.getManyAndCount.mockResolvedValueOnce([[], 0]);
    await service.list({ page: 1, limit: 20, search: '%a_b' });
    const calls = qb.andWhere.mock.calls.find((c: unknown[]) => String(c[0]).includes('LIKE'));
    expect(calls).toBeDefined();
    expect(calls?.[1]).toEqual(expect.objectContaining({ q: expect.stringContaining('\\%a\\_b') }));
  });
});

describe('UsersService.update', () => {
  it('should_reject_when_actor_cannot_edit_target_role', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ role: RoleName.ADMIN }));
    await expect(
      service.update(managerActor, 'user-1', { fullName: 'X' } as UpdateUserDto),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should_let_user_edit_themselves_even_when_role_above', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ id: managerActor.id, role: RoleName.MANAGER }));
    await service.update(managerActor, managerActor.id, { fullName: 'New' });
    expect(repo.save).toHaveBeenCalled();
  });
});

describe('UsersService.softDelete', () => {
  it('should_reject_self_delete', async () => {
    const { service } = buildService();
    await expect(service.softDelete(adminActor, adminActor.id)).rejects.toThrow(/your own account/);
  });

  it('should_reject_super_admin_delete', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ role: RoleName.SUPER_ADMIN }));
    await expect(service.softDelete(adminActor, 'user-1')).rejects.toThrow(
      /SUPER_ADMIN cannot be deleted/,
    );
  });

  it('should_reject_when_actor_cannot_delete_target_role', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ role: RoleName.ADMIN }));
    await expect(service.softDelete(managerActor, 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('should_call_softDelete_on_repository', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ role: RoleName.TEACHER }));
    await service.softDelete(adminActor, 'user-1');
    expect(repo.softDelete).toHaveBeenCalledWith({ id: 'user-1' });
  });
});

describe('UsersService.resetPassword', () => {
  it('should_throw_not_found_when_user_missing', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(null);
    await expect(service.resetPassword(adminActor, 'missing')).rejects.toThrow(NotFoundException);
  });

  it('should_reset_password_and_publish_dedicated_event', async () => {
    const { service, repo, publish } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ role: RoleName.TEACHER }));
    const result = await service.resetPassword(adminActor, 'user-1');
    expect(result.password.length).toBeGreaterThanOrEqual(14);
    expect(repo.update).toHaveBeenCalledWith(
      { id: 'user-1' },
      expect.objectContaining({ mustChangePassword: true }),
    );
    expect(publish).toHaveBeenCalledTimes(1);
    expect((publish.mock.calls[0] as [string])[0]).toBe('user.password_reset');
  });

  it('should_let_a_manager_reset_their_own_password', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ id: managerActor.id, role: RoleName.MANAGER }));
    await expect(service.resetPassword(managerActor, managerActor.id)).resolves.toMatchObject({
      password: expect.any(String),
    });
  });

  it('should_reject_a_manager_resetting_another_managers_password', async () => {
    const { service, repo } = buildService();
    repo.findOne.mockResolvedValue(baseUser({ id: 'other-mgr', role: RoleName.MANAGER }));
    await expect(service.resetPassword(managerActor, 'other-mgr')).rejects.toThrow(
      ForbiddenException,
    );
  });
});
