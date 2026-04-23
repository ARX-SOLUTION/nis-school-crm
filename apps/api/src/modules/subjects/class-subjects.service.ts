import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { ClassEntity } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { AssignSubjectDto } from './dto/assign-subject.dto';
import { UpdateClassSubjectDto } from './dto/update-class-subject.dto';
import { ClassSubject } from './entities/class-subject.entity';
import { Subject } from './entities/subject.entity';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class ClassSubjectsService {
  constructor(
    @InjectRepository(ClassSubject)
    private readonly classSubjects: Repository<ClassSubject>,
    @InjectRepository(ClassEntity)
    private readonly classes: Repository<ClassEntity>,
    @InjectRepository(Subject)
    private readonly subjects: Repository<Subject>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async assign(classId: string, dto: AssignSubjectDto): Promise<ClassSubject> {
    await this.ensureClassExists(classId);
    await this.ensureSubjectActiveExists(dto.subjectId);
    await this.ensureUserIsActiveTeacher(dto.teacherId);

    const hoursPerWeek = dto.hoursPerWeek ?? (await this.getSubjectDefaultHours(dto.subjectId));

    try {
      const row = this.classSubjects.create({
        classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        hoursPerWeek,
        academicYear: dto.academicYear,
      });
      const saved = await this.classSubjects.save(row);
      return this.loadWithRelations(saved.id);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException(
          'This subject is already assigned to the class for the given academic year',
        );
      }
      throw err;
    }
  }

  async list(classId: string, caller: AuthenticatedUser): Promise<ClassSubject[]> {
    await this.ensureClassExists(classId);

    const qb = this.classSubjects
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.subject', 'subject')
      .leftJoinAndSelect('cs.teacher', 'teacher')
      .where('cs.class_id = :classId', { classId });

    // TEACHER role can only see subjects for classes where they are assigned
    if (caller.role === RoleName.TEACHER) {
      qb.andWhere('cs.teacher_id = :callerId', { callerId: caller.id });
    }

    return qb.orderBy('subject.code', 'ASC').getMany();
  }

  async update(classId: string, id: string, dto: UpdateClassSubjectDto): Promise<ClassSubject> {
    const row = await this.findRow(classId, id);

    if (dto.teacherId !== undefined) {
      await this.ensureUserIsActiveTeacher(dto.teacherId);
      row.teacherId = dto.teacherId;
    }
    if (dto.hoursPerWeek !== undefined) {
      row.hoursPerWeek = dto.hoursPerWeek;
    }
    if (dto.academicYear !== undefined) {
      row.academicYear = dto.academicYear;
    }

    try {
      const saved = await this.classSubjects.save(row);
      return this.loadWithRelations(saved.id);
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        throw new ConflictException(
          'This subject is already assigned to the class for the given academic year',
        );
      }
      throw err;
    }
  }

  async remove(classId: string, id: string): Promise<void> {
    const row = await this.findRow(classId, id);
    await this.classSubjects.remove(row);
  }

  // ── private helpers ─────────────────────────────────────────────────────────

  private async ensureClassExists(classId: string): Promise<void> {
    const cls = await this.classes.findOne({ where: { id: classId } });
    if (!cls || cls.deletedAt !== null) {
      throw new NotFoundException('Class not found');
    }
  }

  private async ensureSubjectActiveExists(subjectId: string): Promise<void> {
    const subject = await this.subjects.findOne({ where: { id: subjectId } });
    if (!subject || subject.deletedAt !== null) {
      throw new NotFoundException('Subject not found');
    }
    if (!subject.isActive) {
      throw new BadRequestException('Subject is inactive and cannot be assigned');
    }
  }

  private async ensureUserIsActiveTeacher(userId: string): Promise<void> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('Teacher user not found');
    }
    if (user.role !== RoleName.TEACHER) {
      throw new BadRequestException('Assigned user must have TEACHER role');
    }
    if (!user.isActive) {
      throw new BadRequestException('Teacher user is not active');
    }
  }

  private async getSubjectDefaultHours(subjectId: string): Promise<number> {
    const subject = await this.subjects.findOne({ where: { id: subjectId } });
    return subject?.defaultHoursPerWeek ?? 2;
  }

  private async findRow(classId: string, id: string): Promise<ClassSubject> {
    const row = await this.classSubjects
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.subject', 'subject')
      .leftJoinAndSelect('cs.teacher', 'teacher')
      .where('cs.id = :id AND cs.class_id = :classId', { id, classId })
      .getOne();

    if (!row) {
      throw new NotFoundException('Class subject assignment not found');
    }
    return row;
  }

  private async loadWithRelations(id: string): Promise<ClassSubject> {
    const row = await this.classSubjects
      .createQueryBuilder('cs')
      .leftJoinAndSelect('cs.subject', 'subject')
      .leftJoinAndSelect('cs.teacher', 'teacher')
      .where('cs.id = :id', { id })
      .getOne();

    if (!row) throw new NotFoundException('Class subject assignment not found');
    return row;
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }
}
