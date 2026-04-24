import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsQueryDto } from './dto/subjects-query.dto';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private readonly subjects: Repository<Subject>,
  ) {}

  async create(dto: CreateSubjectDto): Promise<Subject> {
    try {
      return await this.subjects.save(
        this.subjects.create({
          code: dto.code,
          name: dto.name,
          gradeLevels: dto.gradeLevels,
          defaultHoursPerWeek: dto.defaultHoursPerWeek ?? 2,
          isActive: dto.isActive ?? true,
        }),
      );
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException('Subject code already exists');
      }
      throw err;
    }
  }

  async list(query: SubjectsQueryDto): Promise<PaginatedResponseDto<Subject>> {
    const qb = this.subjects.createQueryBuilder('s');

    if (query.search) {
      qb.andWhere('(LOWER(s.code) LIKE :search OR LOWER(s.name) LIKE :search)', {
        search: `%${query.search.toLowerCase()}%`,
      });
    }
    if (query.active !== undefined) {
      qb.andWhere('s.is_active = :active', { active: query.active });
    }
    if (query.gradeLevel !== undefined) {
      qb.andWhere(':gradeLevel = ANY(s.grade_levels)', { gradeLevel: query.gradeLevel });
    }

    qb.orderBy('s.code', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async getById(id: string): Promise<Subject> {
    const entity = await this.subjects.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Subject not found');
    return entity;
  }

  async update(id: string, dto: UpdateSubjectDto): Promise<Subject> {
    const entity = await this.getById(id);
    Object.assign(entity, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.gradeLevels !== undefined ? { gradeLevels: dto.gradeLevels } : {}),
      ...(dto.defaultHoursPerWeek !== undefined
        ? { defaultHoursPerWeek: dto.defaultHoursPerWeek }
        : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.subjects.save(entity);
  }

  async softDelete(id: string): Promise<void> {
    const entity = await this.getById(id);
    await this.subjects.softDelete({ id: entity.id });
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }
}
