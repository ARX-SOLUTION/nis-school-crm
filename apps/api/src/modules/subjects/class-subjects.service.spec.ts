import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClassEntity } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { ClassSubjectsService } from './class-subjects.service';
import { AssignSubjectDto } from './dto/assign-subject.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';
import { ClassSubject } from './entities/class-subject.entity';
import { Subject } from './entities/subject.entity';

// ── fixture builders ─────────────────────────────────────────────────────────

const baseSubject = (over: Partial<Subject> = {}): Subject =>
  ({
    id: 'sub-1',
    code: 'MATH_7',
    name: 'Mathematics',
    gradeLevels: [7],
    defaultHoursPerWeek: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as unknown as Subject;

const baseClass = (over: Partial<ClassEntity> = {}): ClassEntity =>
  ({
    id: 'cls-1',
    name: '7-A',
    gradeLevel: 7,
    academicYear: '2025-2026',
    maxStudents: 30,
    classTeacherId: null,
    roomNumber: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    classTeacher: null,
    ...over,
  }) as unknown as ClassEntity;

const baseUser = (over: Partial<User> = {}): User =>
  ({
    id: 'usr-teacher-1',
    email: 'teacher@example.com',
    fullName: 'Ali Teacher',
    role: RoleName.TEACHER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as unknown as User;

const baseClassSubject = (over: Partial<ClassSubject> = {}): ClassSubject =>
  ({
    id: 'cs-1',
    classId: 'cls-1',
    subjectId: 'sub-1',
    teacherId: 'usr-teacher-1',
    hoursPerWeek: 3,
    academicYear: '2025-2026',
    subject: baseSubject(),
    teacher: baseUser(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as unknown as ClassSubject;

// ── mock helpers ─────────────────────────────────────────────────────────────

function makeQb(rows: ClassSubject[] = []) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(rows[0] ?? null),
    getMany: jest.fn().mockResolvedValue(rows),
  } as unknown as SelectQueryBuilder<ClassSubject>;
}

function makeClassSubjectsRepo(qb?: SelectQueryBuilder<ClassSubject>) {
  const _qb = qb ?? makeQb();
  return {
    create: jest.fn((dto) => dto as ClassSubject),
    save: jest.fn(async (e) => e as ClassSubject),
    remove: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(_qb),
    _qb,
  };
}

function makeClassRepo(seed: ClassEntity | null) {
  return { findOne: jest.fn().mockResolvedValue(seed) };
}

function makeSubjectRepo(seed: Subject | null) {
  return { findOne: jest.fn().mockResolvedValue(seed) };
}

function makeUserRepo(seed: User | null) {
  return { findOne: jest.fn().mockResolvedValue(seed) };
}

type ClassSubjectsRepoMock = ReturnType<typeof makeClassSubjectsRepo>;

function buildService(
  csRepo: ClassSubjectsRepoMock,
  classRepo: ReturnType<typeof makeClassRepo>,
  subjectRepo: ReturnType<typeof makeSubjectRepo>,
  userRepo: ReturnType<typeof makeUserRepo>,
): ClassSubjectsService {
  return new ClassSubjectsService(
    csRepo as unknown as Repository<ClassSubject>,
    classRepo as unknown as Repository<ClassEntity>,
    subjectRepo as unknown as Repository<Subject>,
    userRepo as unknown as Repository<User>,
  );
}

afterEach(() => jest.clearAllMocks());

// ── assign ────────────────────────────────────────────────────────────────────

describe('ClassSubjectsService.assign', () => {
  const dto: AssignSubjectDto = {
    subjectId: 'sub-1',
    teacherId: 'usr-teacher-1',
    academicYear: '2025-2026',
    hoursPerWeek: 4,
  };

  it('should_insert_row_and_return_loaded_with_relations_on_happy_path', async () => {
    const saved = baseClassSubject({ id: 'cs-new' });
    const loadQb = makeQb([saved]);
    const csRepo = makeClassSubjectsRepo();
    csRepo.save.mockResolvedValue({ id: 'cs-new' } as unknown as ClassSubject);
    csRepo.createQueryBuilder
      .mockReturnValueOnce(csRepo._qb) // first call: for loadWithRelations
      .mockReturnValue(loadQb); // subsequent: loadWithRelations
    // Simplify: override save to return full object, override createQueryBuilder
    // to always return loadQb for the second call
    const freshCsRepo = makeClassSubjectsRepo(loadQb);
    freshCsRepo.save.mockResolvedValue({ id: 'cs-new' } as unknown as ClassSubject);
    // loadWithRelations uses createQueryBuilder internally:
    (freshCsRepo.createQueryBuilder as jest.Mock).mockReturnValue(loadQb);

    const service = buildService(
      freshCsRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(baseUser()),
    );
    const result = await service.assign('cls-1', dto);

    expect(freshCsRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: 'cls-1',
        subjectId: 'sub-1',
        teacherId: 'usr-teacher-1',
        academicYear: '2025-2026',
        hoursPerWeek: 4,
      }),
    );
    expect(result).toBe(saved);
  });

  it('should_throw_NotFoundException_when_class_not_found', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(null),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(baseUser()),
    );
    await expect(service.assign('missing-cls', dto)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_NotFoundException_when_class_is_soft_deleted', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo({ ...baseClass(), deletedAt: new Date() } as unknown as ClassEntity),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(baseUser()),
    );
    await expect(service.assign('deleted-cls', dto)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_NotFoundException_when_subject_not_found', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(baseUser()),
    );
    await expect(service.assign('cls-1', dto)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_BadRequestException_when_subject_is_inactive', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(baseClass()),
      makeSubjectRepo(baseSubject({ isActive: false })),
      makeUserRepo(baseUser()),
    );
    await expect(service.assign('cls-1', dto)).rejects.toThrow(BadRequestException);
  });

  it('should_throw_NotFoundException_when_teacher_user_not_found', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(baseClass()),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(null),
    );
    await expect(service.assign('cls-1', dto)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_BadRequestException_when_user_exists_but_role_is_not_TEACHER', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(baseClass()),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(baseUser({ role: RoleName.MANAGER })),
    );
    await expect(service.assign('cls-1', dto)).rejects.toThrow(BadRequestException);
  });

  it('should_throw_ConflictException_on_23505_unique_violation', async () => {
    const csRepo = makeClassSubjectsRepo();
    const driverError = Object.assign(new Error('duplicate'), { code: '23505' });
    csRepo.save.mockRejectedValue(new QueryFailedError('insert', [], driverError));

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(baseSubject()),
      makeUserRepo(baseUser()),
    );
    await expect(service.assign('cls-1', dto)).rejects.toThrow(ConflictException);
  });
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('ClassSubjectsService.list', () => {
  const adminCaller: AuthenticatedUser = {
    id: 'admin-1',
    role: RoleName.ADMIN,
  } as AuthenticatedUser;
  const managerCaller: AuthenticatedUser = {
    id: 'mgr-1',
    role: RoleName.MANAGER,
  } as AuthenticatedUser;
  const teacherCaller: AuthenticatedUser = {
    id: 'usr-teacher-1',
    role: RoleName.TEACHER,
  } as AuthenticatedUser;

  it('should_return_all_rows_for_ADMIN', async () => {
    const rows = [baseClassSubject(), baseClassSubject({ id: 'cs-2' })];
    const qb = makeQb(rows);
    const csRepo = makeClassSubjectsRepo(qb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    const result = await service.list('cls-1', adminCaller);

    expect(result).toHaveLength(2);
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('teacher_id'),
      expect.anything(),
    );
  });

  it('should_return_all_rows_for_MANAGER', async () => {
    const rows = [baseClassSubject()];
    const qb = makeQb(rows);
    const csRepo = makeClassSubjectsRepo(qb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    const result = await service.list('cls-1', managerCaller);

    expect(result).toHaveLength(1);
    expect(qb.andWhere).not.toHaveBeenCalledWith(
      expect.stringContaining('teacher_id'),
      expect.anything(),
    );
  });

  it('should_scope_to_caller_id_for_TEACHER', async () => {
    const rows = [baseClassSubject({ teacherId: 'usr-teacher-1' })];
    const qb = makeQb(rows);
    const csRepo = makeClassSubjectsRepo(qb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    await service.list('cls-1', teacherCaller);

    expect(qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('teacher_id'),
      expect.objectContaining({ callerId: 'usr-teacher-1' }),
    );
  });

  it('should_throw_NotFoundException_when_class_not_found', async () => {
    const service = buildService(
      makeClassSubjectsRepo(),
      makeClassRepo(null),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    await expect(service.list('missing', adminCaller)).rejects.toThrow(NotFoundException);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('ClassSubjectsService.update', () => {
  it('should_update_hoursPerWeek_and_return_saved_row', async () => {
    const existing = baseClassSubject({ hoursPerWeek: 3 });
    const updated = baseClassSubject({ hoursPerWeek: 5 });
    const findQb = makeQb([existing]);
    const loadQb = makeQb([updated]);
    const csRepo = makeClassSubjectsRepo(findQb);
    csRepo.save.mockResolvedValue({ id: 'cs-1' } as unknown as ClassSubject);
    // Second createQueryBuilder call is loadWithRelations
    (csRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce(findQb).mockReturnValue(loadQb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    const dto: UpdateClassSubjectDto = { hoursPerWeek: 5 };
    const result = await service.update('cls-1', 'cs-1', dto);

    expect(csRepo.save).toHaveBeenCalled();
    expect(result).toBe(updated);
  });

  it('should_throw_ConflictException_on_23505_when_changing_academicYear', async () => {
    const existing = baseClassSubject();
    const findQb = makeQb([existing]);
    const csRepo = makeClassSubjectsRepo(findQb);
    const driverError = Object.assign(new Error('duplicate'), { code: '23505' });
    csRepo.save.mockRejectedValue(new QueryFailedError('update', [], driverError));
    (csRepo.createQueryBuilder as jest.Mock).mockReturnValue(findQb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    const dto: UpdateClassSubjectDto = { academicYear: '2026-2027' };
    await expect(service.update('cls-1', 'cs-1', dto)).rejects.toThrow(ConflictException);
  });

  it('should_throw_NotFoundException_when_row_not_found', async () => {
    const emptyQb = makeQb([]);
    const csRepo = makeClassSubjectsRepo(emptyQb);
    (csRepo.createQueryBuilder as jest.Mock).mockReturnValue(emptyQb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    await expect(service.update('cls-1', 'missing', {})).rejects.toThrow(NotFoundException);
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('ClassSubjectsService.remove', () => {
  it('should_call_repo_remove_not_softDelete_on_happy_path', async () => {
    const existing = baseClassSubject();
    const findQb = makeQb([existing]);
    const csRepo = makeClassSubjectsRepo(findQb);
    (csRepo.createQueryBuilder as jest.Mock).mockReturnValue(findQb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    await service.remove('cls-1', 'cs-1');

    expect(csRepo.remove).toHaveBeenCalledWith(existing);
  });

  it('should_throw_NotFoundException_when_row_not_found', async () => {
    const emptyQb = makeQb([]);
    const csRepo = makeClassSubjectsRepo(emptyQb);
    (csRepo.createQueryBuilder as jest.Mock).mockReturnValue(emptyQb);

    const service = buildService(
      csRepo,
      makeClassRepo(baseClass()),
      makeSubjectRepo(null),
      makeUserRepo(null),
    );
    await expect(service.remove('cls-1', 'missing')).rejects.toThrow(NotFoundException);
  });
});
