import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ActorContext } from '../../common/types/actor-context';
import { escapeLikePattern } from '../../common/utils/sql-like';
import { ClassEntity } from '../classes/entities/class.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { StudentsQueryDto } from './dto/students-query.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Student, StudentStatus } from './entities/student.entity';
import { StudentClassHistory } from './entities/student-class-history.entity';
import { StudentCodeService } from './services/student-code.service';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly students: Repository<Student>,
    @InjectRepository(ClassEntity)
    private readonly classes: Repository<ClassEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly codes: StudentCodeService,
  ) {}

  async create(dto: CreateStudentDto, actor: ActorContext): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const studentsRepo = manager.getRepository(Student);
      const classesRepo = manager.getRepository(ClassEntity);

      let targetClass: ClassEntity | null = null;
      let academicYear: number;
      if (dto.classId) {
        targetClass = await this.lockClass(classesRepo, dto.classId);
        if (!targetClass) throw new NotFoundException('Target class not found');
        this.assertClassCompatible(targetClass, dto.gradeLevel);
        await this.assertClassHasSpace(studentsRepo, targetClass);
        academicYear = StudentCodeService.academicYearStart(targetClass.academicYear);
      } else {
        academicYear = new Date().getFullYear();
      }

      const code = await this.codes.next(academicYear, manager);

      let student: Student;
      try {
        student = await studentsRepo.save(
          studentsRepo.create({
            studentCode: code,
            firstName: dto.firstName,
            lastName: dto.lastName,
            middleName: dto.middleName ?? null,
            birthDate: dto.birthDate,
            gender: dto.gender ?? null,
            gradeLevel: dto.gradeLevel,
            classId: targetClass?.id ?? null,
            status: StudentStatus.ACTIVE,
            parentFullName: dto.parentFullName ?? null,
            parentPhone: dto.parentPhone ?? null,
            parentTelegram: dto.parentTelegram ?? null,
            address: dto.address ?? null,
            bloodGroup: dto.bloodGroup ?? null,
            medicalNotes: dto.medicalNotes ?? null,
            enrolledAt: new Date(),
            leftAt: null,
            leftReason: null,
          }),
        );
      } catch (err) {
        if (this.isUniqueViolation(err)) {
          throw new ConflictException('Student code collision — retry');
        }
        throw err;
      }

      if (targetClass) {
        const history = manager.getRepository(StudentClassHistory);
        await history.save(
          history.create({
            studentId: student.id,
            classId: targetClass.id,
            assignedAt: new Date(),
            removedAt: null,
            assignedById: actor.id,
            reason: 'initial enrollment',
          }),
        );
      }

      return student;
    });
  }

  async list(query: StudentsQueryDto): Promise<PaginatedResponseDto<Student>> {
    const qb = this.students.createQueryBuilder('s');
    if (query.classId) qb.andWhere('s.class_id = :classId', { classId: query.classId });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.gradeLevel !== undefined) qb.andWhere('s.grade_level = :g', { g: query.gradeLevel });
    if (query.search) {
      const escaped = escapeLikePattern(query.search.toLowerCase());
      qb.andWhere(
        "(LOWER(s.first_name) LIKE :q ESCAPE '\\' OR LOWER(s.last_name) LIKE :q ESCAPE '\\' OR LOWER(s.student_code) LIKE :q ESCAPE '\\')",
        { q: `%${escaped}%` },
      );
    }
    qb.orderBy('s.created_at', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(
      data,
      PaginatedResponseDto.buildMeta(total, query.page, query.limit),
    );
  }

  async getById(id: string): Promise<Student> {
    const entity = await this.students.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Student not found');
    return entity;
  }

  async update(id: string, dto: UpdateStudentDto): Promise<Student> {
    const entity = await this.getById(id);
    if (
      dto.gradeLevel !== undefined &&
      dto.gradeLevel !== entity.gradeLevel &&
      entity.classId !== null
    ) {
      // Changing grade level while the student is still in a class would
      // make the class-gradeLevel invariant inconsistent. Require the
      // student to be removed from their class before changing grade.
      throw new BadRequestException(
        'Remove the student from their class before changing gradeLevel',
      );
    }
    Object.assign(entity, {
      ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
      ...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
      ...(dto.middleName !== undefined ? { middleName: dto.middleName || null } : {}),
      ...(dto.birthDate !== undefined ? { birthDate: dto.birthDate } : {}),
      ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
      ...(dto.gradeLevel !== undefined ? { gradeLevel: dto.gradeLevel } : {}),
      ...(dto.parentFullName !== undefined ? { parentFullName: dto.parentFullName || null } : {}),
      ...(dto.parentPhone !== undefined ? { parentPhone: dto.parentPhone || null } : {}),
      ...(dto.parentTelegram !== undefined ? { parentTelegram: dto.parentTelegram || null } : {}),
      ...(dto.address !== undefined ? { address: dto.address || null } : {}),
      ...(dto.bloodGroup !== undefined ? { bloodGroup: dto.bloodGroup || null } : {}),
      ...(dto.medicalNotes !== undefined ? { medicalNotes: dto.medicalNotes || null } : {}),
    });
    return this.students.save(entity);
  }

  /**
   * Move a student into a class. Runs in a transaction with a row-level lock
   * on the target class so two concurrent assignments can't both pass the
   * capacity check against the same row.
   */
  async assignClass(
    studentId: string,
    targetClassId: string,
    actor: ActorContext,
    reason?: string,
  ): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const studentsRepo = manager.getRepository(Student);
      const classesRepo = manager.getRepository(ClassEntity);
      const historyRepo = manager.getRepository(StudentClassHistory);

      const student = await studentsRepo.findOne({ where: { id: studentId } });
      if (!student) throw new NotFoundException('Student not found');
      if (student.status !== StudentStatus.ACTIVE) {
        throw new BadRequestException('Cannot assign an inactive student to a class');
      }

      const targetClass = await this.lockClass(classesRepo, targetClassId);
      if (!targetClass) throw new NotFoundException('Target class not found');
      this.assertClassCompatible(targetClass, student.gradeLevel);
      await this.assertClassHasSpace(studentsRepo, targetClass, student.id);

      const previousClassId = student.classId;
      if (previousClassId && previousClassId !== targetClass.id) {
        await historyRepo.update(
          { studentId: student.id, classId: previousClassId, removedAt: IsNull() },
          { removedAt: new Date() },
        );
      }

      if (previousClassId !== targetClass.id) {
        await historyRepo.save(
          historyRepo.create({
            studentId: student.id,
            classId: targetClass.id,
            assignedAt: new Date(),
            removedAt: null,
            assignedById: actor.id,
            reason: reason ?? null,
          }),
        );
      }

      student.classId = targetClass.id;
      return studentsRepo.save(student);
    });
  }

  async archive(id: string, reason: string): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const studentsRepo = manager.getRepository(Student);
      const historyRepo = manager.getRepository(StudentClassHistory);

      const student = await studentsRepo.findOne({ where: { id } });
      if (!student) throw new NotFoundException('Student not found');
      if (student.status !== StudentStatus.ACTIVE) {
        throw new BadRequestException('Student is already archived or graduated');
      }

      if (student.classId) {
        await historyRepo.update(
          { studentId: student.id, classId: student.classId, removedAt: IsNull() },
          { removedAt: new Date(), reason },
        );
      }

      student.status = StudentStatus.INACTIVE;
      student.classId = null;
      student.leftAt = new Date();
      student.leftReason = reason;
      return studentsRepo.save(student);
    });
  }

  /** Admin-only CSV export of every non-deleted student. */
  async exportCsv(): Promise<string> {
    const rows = await this.students
      .createQueryBuilder('s')
      .orderBy('s.student_code', 'ASC')
      .getMany();

    const header = [
      'student_code',
      'first_name',
      'last_name',
      'middle_name',
      'birth_date',
      'gender',
      'grade_level',
      'status',
      'class_id',
      'parent_full_name',
      'parent_phone',
      'enrolled_at',
      'left_at',
      'left_reason',
    ].join(',');

    const body = rows.map((r) =>
      [
        r.studentCode,
        r.firstName,
        r.lastName,
        r.middleName ?? '',
        r.birthDate,
        r.gender ?? '',
        r.gradeLevel,
        r.status,
        r.classId ?? '',
        r.parentFullName ?? '',
        r.parentPhone ?? '',
        r.enrolledAt.toISOString(),
        r.leftAt?.toISOString() ?? '',
        r.leftReason ?? '',
      ]
        .map((v) => csvField(String(v)))
        .join(','),
    );

    return [header, ...body, ''].join('\n');
  }

  async findHistory(studentId: string): Promise<StudentClassHistory[]> {
    return this.dataSource
      .getRepository(StudentClassHistory)
      .find({ where: { studentId }, order: { assignedAt: 'DESC' } });
  }

  /** TEACHER self-serve — returns the class + students for the user's class. */
  async findForTeacher(teacherId: string): Promise<Student[]> {
    return this.students
      .createQueryBuilder('s')
      .innerJoin(ClassEntity, 'c', 'c.id = s.class_id AND c.deleted_at IS NULL')
      .where('c.class_teacher_id = :t', { t: teacherId })
      .andWhere('s.status = :status', { status: StudentStatus.ACTIVE })
      .orderBy('s.last_name', 'ASC')
      .addOrderBy('s.first_name', 'ASC')
      .getMany();
  }

  private async lockClass(repo: Repository<ClassEntity>, id: string): Promise<ClassEntity | null> {
    return repo
      .createQueryBuilder('c')
      .setLock('pessimistic_write')
      .where('c.id = :id', { id })
      .getOne();
  }

  private assertClassCompatible(targetClass: ClassEntity, studentGrade: number): void {
    if (!targetClass.isActive) {
      throw new BadRequestException('Target class is not active');
    }
    if (targetClass.gradeLevel !== studentGrade) {
      throw new BadRequestException(
        `gradeLevel mismatch — student is ${studentGrade}, class is ${targetClass.gradeLevel}`,
      );
    }
  }

  private async assertClassHasSpace(
    studentsRepo: Repository<Student>,
    targetClass: ClassEntity,
    ignoreStudentId?: string,
  ): Promise<void> {
    const qb = studentsRepo
      .createQueryBuilder('s')
      .where('s.class_id = :cid', { cid: targetClass.id })
      .andWhere('s.status = :status', { status: StudentStatus.ACTIVE });
    if (ignoreStudentId) qb.andWhere('s.id <> :sid', { sid: ignoreStudentId });
    const current = await qb.getCount();
    if (current >= targetClass.maxStudents) {
      throw new BadRequestException(`Class is full (${current}/${targetClass.maxStudents})`);
    }
  }

  private isUniqueViolation(err: unknown): boolean {
    if (!(err instanceof QueryFailedError)) return false;
    const candidate = err as unknown as { code?: unknown };
    return typeof candidate.code === 'string' && candidate.code === PG_UNIQUE_VIOLATION;
  }
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
