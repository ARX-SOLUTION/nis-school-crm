import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { User } from '../users/entities/user.entity';
import { ClassesQueryDto } from './dto/classes-query.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassEntity } from './entities/class.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classes: Repository<ClassEntity>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassEntity> {
    if (dto.classTeacherId) {
      await this.ensureUserIsTeacher(dto.classTeacherId);
    }
    try {
      return await this.classes.save(
        this.classes.create({
          name: dto.name,
          gradeLevel: dto.gradeLevel,
          academicYear: dto.academicYear,
          maxStudents: dto.maxStudents ?? 30,
          roomNumber: dto.roomNumber ?? null,
          classTeacherId: dto.classTeacherId ?? null,
          isActive: dto.isActive ?? true,
        }),
      );
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException(
          `A class named "${dto.name}" already exists for ${dto.academicYear}`,
        );
      }
      throw err;
    }
  }

  async list(query: ClassesQueryDto): Promise<PaginatedResponseDto<ClassEntity>> {
    const qb = this.classes.createQueryBuilder('c');
    if (query.gradeLevel !== undefined) {
      qb.andWhere('c.grade_level = :g', { g: query.gradeLevel });
    }
    if (query.academicYear) {
      qb.andWhere('c.academic_year = :y', { y: query.academicYear });
    }
    qb.orderBy('c.grade_level', 'ASC')
      .addOrderBy('c.name', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async getById(id: string): Promise<ClassEntity> {
    const entity = await this.classes.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Class not found');
    return entity;
  }

  async update(id: string, dto: UpdateClassDto): Promise<ClassEntity> {
    const entity = await this.getById(id);
    Object.assign(entity, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.maxStudents !== undefined ? { maxStudents: dto.maxStudents } : {}),
      ...(dto.roomNumber !== undefined ? { roomNumber: dto.roomNumber || null } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    });
    return this.classes.save(entity);
  }

  async softDelete(id: string): Promise<void> {
    await this.classes.softDelete({ id });
  }

  async assignTeacher(id: string, teacherId: string): Promise<ClassEntity> {
    await this.ensureUserIsTeacher(teacherId);
    const entity = await this.getById(id);
    entity.classTeacherId = teacherId;
    return this.classes.save(entity);
  }

  findByTeacher(teacherId: string): Promise<ClassEntity | null> {
    return this.classes.findOne({ where: { classTeacherId: teacherId, isActive: true } });
  }

  private async ensureUserIsTeacher(userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Target teacher user not found');
    if (user.role !== RoleName.TEACHER) {
      throw new BadRequestException('Class teacher must have TEACHER role');
    }
    if (!user.isActive || user.deletedAt !== null) {
      throw new BadRequestException('Class teacher user is not active');
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }
}
