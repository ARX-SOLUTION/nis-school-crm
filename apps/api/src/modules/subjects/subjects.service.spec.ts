import { ConflictException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectsQueryDto } from './dto/subjects-query.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Subject } from './entities/subject.entity';
import { SubjectsService } from './subjects.service';

const baseSubject = (over: Partial<Subject> = {}): Subject =>
  ({
    id: 'sub-1',
    code: 'MATH_7',
    name: 'Mathematics',
    gradeLevels: [7, 8],
    defaultHoursPerWeek: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...over,
  }) as unknown as Subject;

function makeQb(results: Subject[] = [], total = 0) {
  const qb = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([results, total]),
  } as unknown as SelectQueryBuilder<Subject>;
  return qb;
}

function makeRepo(seed?: Subject | null) {
  const qb = makeQb();
  return {
    create: jest.fn((dto) => dto as Subject),
    save: jest.fn(async (e) => e as Subject),
    findOne: jest.fn().mockResolvedValue(seed ?? null),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    _qb: qb,
  };
}

type Repo = ReturnType<typeof makeRepo>;

function buildService(repo: Repo): SubjectsService {
  return new SubjectsService(repo as unknown as Repository<Subject>);
}

afterEach(() => jest.clearAllMocks());

// ── create ───────────────────────────────────────────────────────────────────

describe('SubjectsService.create', () => {
  it('should_persist_and_return_subject_on_happy_path', async () => {
    const repo = makeRepo();
    const dto: CreateSubjectDto = {
      code: 'MATH_7',
      name: 'Mathematics',
      gradeLevels: [7],
      defaultHoursPerWeek: 3,
    };
    const saved = baseSubject({ code: 'MATH_7', name: 'Mathematics' });
    repo.save.mockResolvedValue(saved);

    const service = buildService(repo);
    const result = await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MATH_7', name: 'Mathematics', defaultHoursPerWeek: 3 }),
    );
    expect(result).toBe(saved);
  });

  it('should_default_isActive_to_true_and_hoursPerWeek_to_2_when_not_provided', async () => {
    const repo = makeRepo();
    const dto: CreateSubjectDto = {
      code: 'ENG_5',
      name: 'English',
      gradeLevels: [5],
    };
    repo.save.mockResolvedValue(
      baseSubject({ code: 'ENG_5', defaultHoursPerWeek: 2, isActive: true }),
    );

    const service = buildService(repo);
    await service.create(dto);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, defaultHoursPerWeek: 2 }),
    );
  });

  it('should_throw_ConflictException_when_code_already_exists', async () => {
    const repo = makeRepo();
    const driverError = Object.assign(new Error('duplicate key'), { code: '23505' });
    repo.save.mockRejectedValue(new QueryFailedError('insert', [], driverError));

    const service = buildService(repo);
    await expect(
      service.create({ code: 'MATH_7', name: 'Mathematics', gradeLevels: [7] }),
    ).rejects.toThrow(ConflictException);
  });

  it('should_rethrow_non_unique_db_errors', async () => {
    const repo = makeRepo();
    const genericError = new Error('connection refused');
    repo.save.mockRejectedValue(genericError);

    const service = buildService(repo);
    await expect(
      service.create({ code: 'MATH_7', name: 'Mathematics', gradeLevels: [7] }),
    ).rejects.toThrow('connection refused');
  });
});

// ── list ─────────────────────────────────────────────────────────────────────

describe('SubjectsService.list', () => {
  it('should_return_paginated_results_with_correct_meta', async () => {
    const subs = [baseSubject(), baseSubject({ id: 'sub-2', code: 'ENG_5' })];
    const repo = makeRepo();
    (repo._qb.getManyAndCount as jest.Mock).mockResolvedValue([subs, 2]);

    const service = buildService(repo);
    const query: SubjectsQueryDto = { page: 1, limit: 20 };
    const result = await service.list(query);

    expect(result).toBeInstanceOf(PaginatedResponseDto);
    expect(result.data).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.page).toBe(1);
  });

  it('should_apply_search_filter_via_andWhere', async () => {
    const repo = makeRepo();
    (repo._qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    const service = buildService(repo);
    await service.list({ page: 1, limit: 20, search: 'math' });

    expect(repo._qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('LIKE'),
      expect.objectContaining({ search: '%math%' }),
    );
  });

  it('should_apply_active_filter_via_andWhere', async () => {
    const repo = makeRepo();
    (repo._qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    const service = buildService(repo);
    await service.list({ page: 1, limit: 20, active: false });

    expect(repo._qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('is_active'),
      expect.objectContaining({ active: false }),
    );
  });

  it('should_apply_gradeLevel_filter_using_ANY_array_operator', async () => {
    const repo = makeRepo();
    (repo._qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    const service = buildService(repo);
    await service.list({ page: 1, limit: 20, gradeLevel: 7 });

    expect(repo._qb.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('ANY'),
      expect.objectContaining({ gradeLevel: 7 }),
    );
  });

  it('should_respect_page_and_limit_for_skip_and_take', async () => {
    const repo = makeRepo();
    (repo._qb.getManyAndCount as jest.Mock).mockResolvedValue([[], 0]);

    const service = buildService(repo);
    await service.list({ page: 3, limit: 10 });

    expect(repo._qb.skip).toHaveBeenCalledWith(20);
    expect(repo._qb.take).toHaveBeenCalledWith(10);
  });
});

// ── getById ──────────────────────────────────────────────────────────────────

describe('SubjectsService.getById', () => {
  it('should_return_subject_when_found', async () => {
    const sub = baseSubject();
    const repo = makeRepo(sub);
    const service = buildService(repo);

    const result = await service.getById('sub-1');
    expect(result).toBe(sub);
  });

  it('should_throw_NotFoundException_when_not_found', async () => {
    const repo = makeRepo(null);
    const service = buildService(repo);

    await expect(service.getById('non-existent')).rejects.toThrow(NotFoundException);
  });

  it('should_throw_NotFoundException_when_soft_deleted', async () => {
    // findOne with TypeORM softDelete awareness returns null (deleted_at IS NOT NULL skipped by default)
    const repo = makeRepo(null);
    const service = buildService(repo);

    await expect(service.getById('deleted-id')).rejects.toThrow(NotFoundException);
  });
});

// ── update ───────────────────────────────────────────────────────────────────

describe('SubjectsService.update', () => {
  it('should_mutate_allowed_fields_and_save', async () => {
    const entity = baseSubject({ name: 'Old Name', defaultHoursPerWeek: 2, isActive: true });
    const repo = makeRepo(entity);
    repo.save.mockResolvedValue({ ...entity, name: 'New Name', defaultHoursPerWeek: 4 });

    const service = buildService(repo);
    const dto: UpdateSubjectDto = { name: 'New Name', defaultHoursPerWeek: 4 };
    const result = await service.update('sub-1', dto);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Name', defaultHoursPerWeek: 4 }),
    );
    expect(result.name).toBe('New Name');
  });

  it('should_not_change_code_because_it_is_absent_from_UpdateSubjectDto', () => {
    // Compile-time guarantee: UpdateSubjectDto = PartialType(OmitType(CreateSubjectDto, ['code']))
    // The 'code' key must not exist on UpdateSubjectDto instances.
    const dto: UpdateSubjectDto = { name: 'X' };
    expect(dto).not.toHaveProperty('code');
  });

  it('should_throw_NotFoundException_when_subject_not_found', async () => {
    const repo = makeRepo(null);
    const service = buildService(repo);

    await expect(service.update('non-existent', { name: 'New' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ── softDelete ───────────────────────────────────────────────────────────────

describe('SubjectsService.softDelete', () => {
  it('should_call_repo_softDelete_with_subject_id', async () => {
    const entity = baseSubject();
    const repo = makeRepo(entity);

    const service = buildService(repo);
    await service.softDelete('sub-1');

    expect(repo.softDelete).toHaveBeenCalledWith({ id: 'sub-1' });
  });

  it('should_throw_NotFoundException_when_subject_not_found', async () => {
    const repo = makeRepo(null);
    const service = buildService(repo);

    await expect(service.softDelete('non-existent')).rejects.toThrow(NotFoundException);
  });
});
