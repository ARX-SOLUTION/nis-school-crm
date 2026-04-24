import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { createHash, createHmac } from 'crypto';
import { ParentInviteService } from './parent-invite.service';
import { ParentInvite } from '../entities/parent-invite.entity';
import { ParentStudent } from '../entities/parent-student.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { RoleName } from '../../../common/enums/role.enum';
import {
  TelegramAuthService,
  TelegramAuthPayload,
} from '../../auth/services/telegram-auth.service';

// ---------------------------------------------------------------------------
// Hash helper — same algorithm as TelegramAuthService
// ---------------------------------------------------------------------------

const FAKE_BOT_TOKEN = 'test_bot_token_123';

function buildDataCheckString(fields: Omit<TelegramAuthPayload, 'hash'>): string {
  return (Object.entries(fields) as [string, string | number | undefined][])
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('\n');
}

function computeHash(fields: Omit<TelegramAuthPayload, 'hash'>): string {
  const secretKey = createHash('sha256').update(FAKE_BOT_TOKEN).digest();
  return createHmac('sha256', secretKey).update(buildDataCheckString(fields)).digest('hex');
}

function freshTelegramPayload(id = 999001): TelegramAuthPayload {
  const fields: Omit<TelegramAuthPayload, 'hash'> = {
    id,
    first_name: 'Parent',
    last_name: 'User',
    auth_date: Math.floor(Date.now() / 1000) - 30,
  };
  return { ...fields, hash: computeHash(fields) };
}

// ---------------------------------------------------------------------------
// Stubs / mocks
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid-1',
    email: 'tg_999001@nis.parent',
    passwordHash: 'hashed',
    fullName: 'Parent User',
    phone: null,
    role: RoleName.PARENT,
    telegramChatId: '999001',
    telegramUsername: null,
    telegramFirstName: 'Parent',
    telegramLastName: 'User',
    telegramPhotoUrl: null,
    language: 'uz',
    isActive: true,
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as User;
}

function makeStudent(id = 'student-uuid-1'): Student {
  return { id } as Student;
}

function makeInvite(overrides: Partial<ParentInvite> = {}): ParentInvite {
  return {
    id: 'invite-uuid-1',
    token: 'a'.repeat(64),
    studentId: 'student-uuid-1',
    parentName: 'Test Parent',
    relationship: 'MOTHER',
    createdById: 'creator-user-id',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usedAt: null,
    usedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  } as ParentInvite;
}

function makeParentStudent(): ParentStudent {
  return {
    id: 'ps-uuid-1',
    parentUserId: 'user-uuid-1',
    studentId: 'student-uuid-1',
    relationship: 'MOTHER',
    isPrimary: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as ParentStudent;
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

interface Built {
  service: ParentInviteService;
  inviteRepo: jest.Mocked<Repository<ParentInvite>>;
  parentStudentRepo: jest.Mocked<Repository<ParentStudent>>;
  studentRepo: jest.Mocked<Repository<Student>>;
  userRepo: jest.Mocked<Repository<User>>;
  dataSource: jest.Mocked<DataSource>;
  telegramAuth: jest.Mocked<TelegramAuthService>;
  txManager: jest.Mocked<EntityManager>;
}

function buildService(): Built {
  const inviteRepo = {
    create: jest.fn((data) => ({ ...data }) as ParentInvite),
    save: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn().mockResolvedValue({}),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<Repository<ParentInvite>>;

  const parentStudentRepo = {
    create: jest.fn((data) => ({ ...data }) as ParentStudent),
    save: jest.fn(),
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<ParentStudent>>;

  const studentRepo = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<Student>>;

  const userRepo = {
    findOne: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;

  // txManager replicates the subset of EntityManager used inside the transaction callback.
  // We cast through unknown to sidestep the overloaded EntityManager.create signature —
  // TypeScript cannot pick the right overload when the entity class is passed as unknown.
  const txManager = {
    query: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((_entity: unknown, data: unknown) => ({
      ...(data as object),
    })) as unknown as EntityManager['create'],
    save: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
  } as unknown as jest.Mocked<EntityManager>;

  const dataSource = {
    transaction: jest.fn(async (cb: (manager: EntityManager) => Promise<unknown>) =>
      cb(txManager as unknown as EntityManager),
    ),
  } as unknown as jest.Mocked<DataSource>;

  const telegramAuth = {
    validate: jest.fn((payload: TelegramAuthPayload) => payload),
    verifyHash: jest.fn(() => true),
  } as unknown as jest.Mocked<TelegramAuthService>;

  const config = {
    getOrThrow: jest.fn((key: string) => (key === 'BCRYPT_COST' ? 4 : undefined)),
  } as unknown as ConfigService;

  const service = new ParentInviteService(
    inviteRepo as Repository<ParentInvite>,
    parentStudentRepo as Repository<ParentStudent>,
    studentRepo as Repository<Student>,
    userRepo as Repository<User>,
    dataSource as DataSource,
    telegramAuth as TelegramAuthService,
    config,
  );

  return {
    service,
    inviteRepo,
    parentStudentRepo,
    studentRepo,
    userRepo,
    dataSource,
    telegramAuth,
    txManager,
  };
}

// ---------------------------------------------------------------------------
// createInvite
// ---------------------------------------------------------------------------

describe('ParentInviteService.createInvite', () => {
  it('should_generate_64_char_hex_token_and_save_invite_when_student_exists', async () => {
    const { service, studentRepo, inviteRepo } = buildService();

    studentRepo.findOne.mockResolvedValue(makeStudent());
    inviteRepo.save.mockImplementation(
      async (inv) => ({ id: 'new-invite-id', ...inv }) as ParentInvite,
    );

    const result = await service.createInvite({
      studentId: 'student-uuid-1',
      createdById: 'creator-id',
      parentName: 'Dilnoza',
      relationship: 'MOTHER',
    });

    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(inviteRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should_set_expiresAt_approximately_7_days_from_now', async () => {
    const { service, studentRepo, inviteRepo } = buildService();

    studentRepo.findOne.mockResolvedValue(makeStudent());
    inviteRepo.save.mockImplementation(
      async (inv) => ({ id: 'new-invite-id', ...inv }) as ParentInvite,
    );

    const before = Date.now();
    await service.createInvite({
      studentId: 'student-uuid-1',
      createdById: 'creator-id',
    });
    const after = Date.now();

    const savedInvite = inviteRepo.save.mock.calls[0]![0] as ParentInvite;
    const expiresMs = savedInvite.expiresAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    expect(expiresMs).toBeGreaterThanOrEqual(before + sevenDaysMs - 100);
    expect(expiresMs).toBeLessThanOrEqual(after + sevenDaysMs + 100);
  });

  it('should_throw_NotFoundException_when_student_does_not_exist', async () => {
    const { service, studentRepo } = buildService();
    studentRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createInvite({ studentId: 'ghost-id', createdById: 'creator-id' }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// acceptInvite
// ---------------------------------------------------------------------------

describe('ParentInviteService.acceptInvite', () => {
  it('should_create_new_parent_user_and_link_to_student_when_invite_is_valid', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload(777001);
    const invite = makeInvite({ id: 'invite-id-1', studentId: 'student-uuid-1' });
    const newUser = makeUser({
      id: 'new-parent-id',
      role: RoleName.PARENT,
      telegramChatId: '777001',
    });
    const parentStudentLink = makeParentStudent();

    telegramAuth.validate.mockReturnValue(payload);

    // Step 3 — FOR UPDATE row lock returns the invite id
    txManager.query.mockResolvedValue([{ id: invite.id }]);

    // Step 3b — reload invite
    (txManager.findOne as jest.Mock)
      .mockResolvedValueOnce(invite) // load invite
      .mockResolvedValueOnce(null) // no existing user by telegramChatId
      .mockResolvedValueOnce(null) // no existing parent_students link
      .mockResolvedValueOnce(newUser); // reload after update (not reached in create path, but guard)

    // Step 5 — new user create + save
    (txManager.create as jest.Mock).mockImplementation((_entity: unknown, data: unknown) => ({
      ...(data as object),
    }));
    (txManager.save as jest.Mock)
      .mockResolvedValueOnce({ ...newUser }) // user save
      .mockResolvedValueOnce(parentStudentLink) // parentStudent save
      .mockResolvedValueOnce(invite); // invite burn

    const result = await service.acceptInvite({ token: invite.token, telegramPayload: payload });

    expect(telegramAuth.validate).toHaveBeenCalledWith(payload);
    expect(txManager.query).toHaveBeenCalledWith(expect.stringContaining('parent_invites'), [
      invite.token,
    ]);
    expect(result.invite.usedAt).toBeInstanceOf(Date);
  });

  it('should_throw_BadRequestException_when_invite_is_already_used', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload();
    const usedInvite = makeInvite({ usedAt: new Date(Date.now() - 1000) });

    telegramAuth.validate.mockReturnValue(payload);
    // Use mockResolvedValue (persistent) so the mock survives re-entrant calls.
    txManager.query.mockResolvedValue([{ id: usedInvite.id }]);
    (txManager.findOne as jest.Mock).mockResolvedValue(usedInvite);

    await expect(
      service.acceptInvite({ token: usedInvite.token, telegramPayload: payload }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.acceptInvite({ token: usedInvite.token, telegramPayload: payload }),
    ).rejects.toThrow(/already been used/i);
  });

  it('should_throw_BadRequestException_when_invite_has_expired', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload();
    const expiredInvite = makeInvite({
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });

    telegramAuth.validate.mockReturnValue(payload);
    txManager.query.mockResolvedValue([{ id: expiredInvite.id }]);
    (txManager.findOne as jest.Mock).mockResolvedValue(expiredInvite);

    await expect(
      service.acceptInvite({ token: expiredInvite.token, telegramPayload: payload }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.acceptInvite({ token: expiredInvite.token, telegramPayload: payload }),
    ).rejects.toThrow(/expired/i);
  });

  it('should_reuse_existing_parent_user_when_same_telegram_id_is_seen_again', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload(555001);
    const invite = makeInvite({ id: 'invite-2nd', studentId: 'student-uuid-2' });
    const existingParent = makeUser({
      id: 'existing-parent-id',
      role: RoleName.PARENT,
      telegramChatId: '555001',
    });
    const parentStudentLink = makeParentStudent();

    telegramAuth.validate.mockReturnValue(payload);
    txManager.query.mockResolvedValue([{ id: invite.id }]);

    (txManager.findOne as jest.Mock)
      .mockResolvedValueOnce(invite) // load invite
      .mockResolvedValueOnce(existingParent) // user by telegramChatId — found
      .mockResolvedValueOnce(existingParent) // reload after update
      .mockResolvedValueOnce(null); // no existing parent_students link

    (txManager.save as jest.Mock)
      .mockResolvedValueOnce(parentStudentLink)
      .mockResolvedValueOnce(invite);

    const result = await service.acceptInvite({ token: invite.token, telegramPayload: payload });

    // No new user was created via manager.create
    const createCalls = (txManager.create as jest.Mock).mock.calls as [
      unknown,
      Record<string, unknown>,
    ][];
    const userCreateCalls = createCalls.filter(
      ([, data]) => data['role'] === RoleName.PARENT && data['email'],
    );
    expect(userCreateCalls).toHaveLength(0);
    expect(result.user.id).toBe(existingParent.id);
  });

  it('should_throw_ConflictException_when_telegram_id_belongs_to_a_staff_user', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload(333001);
    const invite = makeInvite();
    const staffUser = makeUser({ role: RoleName.ADMIN, telegramChatId: '333001' });

    telegramAuth.validate.mockReturnValue(payload);
    txManager.query.mockResolvedValue([{ id: invite.id }]);

    // Use persistent mocks (mockResolvedValue) so the sequence works for both
    // expect().rejects calls (first asserts type, second asserts message).
    (txManager.findOne as jest.Mock)
      .mockResolvedValueOnce(invite) // load invite (first call)
      .mockResolvedValueOnce(staffUser) // user lookup — staff (first call)
      .mockResolvedValueOnce(invite) // load invite (second call)
      .mockResolvedValueOnce(staffUser); // user lookup — staff (second call)

    await expect(
      service.acceptInvite({ token: invite.token, telegramPayload: payload }),
    ).rejects.toThrow(ConflictException);
    await expect(
      service.acceptInvite({ token: invite.token, telegramPayload: payload }),
    ).rejects.toThrow(/staff/i);
  });

  it('should_throw_NotFoundException_when_invite_token_is_not_found', async () => {
    const { service, txManager, telegramAuth } = buildService();

    const payload = freshTelegramPayload();
    telegramAuth.validate.mockReturnValue(payload);
    txManager.query.mockResolvedValue([]); // empty result — no row found

    await expect(
      service.acceptInvite({ token: 'b'.repeat(64), telegramPayload: payload }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should_delegate_hash_validation_to_TelegramAuthService_before_opening_transaction', async () => {
    const { service, txManager, telegramAuth, dataSource } = buildService();

    const payload = freshTelegramPayload();
    // Simulate TelegramAuthService throwing (bad hash)
    telegramAuth.validate.mockImplementation(() => {
      throw new Error('Telegram validation failed');
    });

    await expect(
      service.acceptInvite({ token: 'c'.repeat(64), telegramPayload: payload }),
    ).rejects.toThrow('Telegram validation failed');

    // The transaction must never have been opened
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(txManager.query).not.toHaveBeenCalled();
  });
});
