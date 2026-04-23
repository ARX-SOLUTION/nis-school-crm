import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, EntityTarget, Repository } from 'typeorm';
import { RoleName } from '../../common/enums/role.enum';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student, StudentStatus } from './entities/student.entity';
import { StudentClassHistory } from './entities/student-class-history.entity';
import { StudentCodeService } from './services/student-code.service';
import { StudentsService } from './students.service';

const actor = { id: 'mgr-1', role: RoleName.MANAGER };

const buildClass = (over: Partial<ClassEntity> = {}): ClassEntity =>
  ({
    id: 'c-1',
    name: '4-A',
    gradeLevel: 4,
    academicYear: '2026-2027',
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

const buildStudent = (over: Partial<Student> = {}): Student =>
  ({
    id: 's-1',
    studentCode: 'NIS-2026-00001',
    firstName: 'Shaxzod',
    lastName: 'Karimov',
    middleName: null,
    birthDate: '2015-03-15',
    gender: null,
    gradeLevel: 4,
    classId: null,
    status: StudentStatus.ACTIVE,
    parentFullName: null,
    parentPhone: null,
    parentTelegram: null,
    address: null,
    bloodGroup: null,
    medicalNotes: null,
    enrolledAt: new Date(),
    leftAt: null,
    leftReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    class: null,
    ...over,
  }) as unknown as Student;

interface TxRepos {
  student: ReturnType<typeof makeStudentRepo>;
  classes: ReturnType<typeof makeClassesRepo>;
  history: ReturnType<typeof makeHistoryRepo>;
}

function makeStudentRepo(seed: Student | null) {
  return {
    findOne: jest.fn().mockResolvedValue(seed),
    save: jest.fn(async (e) => e as Student),
    createQueryBuilder: jest.fn(),
  };
}
function makeClassesRepo(seed: ClassEntity | null) {
  const qb = {
    setLock: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(seed),
  };
  return { createQueryBuilder: jest.fn().mockReturnValue(qb), qb };
}
function makeHistoryRepo() {
  return {
    update: jest.fn(),
    save: jest.fn(async (e) => e as StudentClassHistory),
    create: jest.fn((e) => e),
  };
}

const buildDataSource = (tx: TxRepos): DataSource =>
  ({
    transaction: jest.fn(async (cb: (m: EntityManager) => Promise<Student>) => {
      const manager = {
        getRepository: (target: EntityTarget<unknown>) => {
          if (target === Student) return tx.student;
          if (target === ClassEntity) {
            return { createQueryBuilder: tx.classes.createQueryBuilder };
          }
          if (target === StudentClassHistory) return tx.history;
          throw new Error(`Unmocked repo request for target ${String(target)}`);
        },
      } as unknown as EntityManager;
      return cb(manager);
    }),
  }) as unknown as DataSource;

describe('StudentsService.assignClass', () => {
  const buildStudentsQbCount = (count: number) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getCount: jest.fn().mockResolvedValue(count),
  });

  const buildService = (
    student: Student | null,
    cls: ClassEntity | null,
    currentCount = 0,
  ): { service: StudentsService; tx: TxRepos } => {
    const tx: TxRepos = {
      student: makeStudentRepo(student),
      classes: makeClassesRepo(cls),
      history: makeHistoryRepo(),
    };
    tx.student.createQueryBuilder.mockReturnValue(buildStudentsQbCount(currentCount));

    const dataSource = buildDataSource(tx);
    const studentsRepo = {
      createQueryBuilder: jest.fn(),
    } as unknown as Repository<Student>;
    const classesRepo = {} as unknown as Repository<ClassEntity>;
    const codes = { next: jest.fn() } as unknown as StudentCodeService;
    return {
      service: new StudentsService(studentsRepo, classesRepo, dataSource, codes),
      tx,
    };
  };

  it('should_throw_when_student_missing', async () => {
    const { service } = buildService(null, buildClass());
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_when_target_class_missing', async () => {
    const { service } = buildService(buildStudent(), null);
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(NotFoundException);
  });

  it('should_throw_when_student_is_inactive', async () => {
    const { service } = buildService(
      buildStudent({ status: StudentStatus.INACTIVE }),
      buildClass(),
    );
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(/inactive student/);
  });

  it('should_throw_when_grade_level_mismatches', async () => {
    const { service } = buildService(buildStudent({ gradeLevel: 5 }), buildClass());
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(/gradeLevel mismatch/);
  });

  it('should_throw_when_class_is_full', async () => {
    const { service } = buildService(buildStudent(), buildClass({ maxStudents: 2 }), 2);
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(/Class is full/);
  });

  it('should_throw_when_target_class_inactive', async () => {
    const { service } = buildService(buildStudent(), buildClass({ isActive: false }));
    await expect(service.assignClass('s-1', 'c-1', actor)).rejects.toThrow(/not active/);
  });

  it('should_assign_and_write_history_when_valid', async () => {
    const { service, tx } = buildService(buildStudent(), buildClass(), 10);
    const result = await service.assignClass('s-1', 'c-1', actor, 'parent request');
    expect(result.classId).toBe('c-1');
    expect(tx.history.save).toHaveBeenCalledTimes(1);
    expect(tx.student.save).toHaveBeenCalled();
  });

  it('should_mark_previous_history_row_removed_when_switching_classes', async () => {
    const { service, tx } = buildService(buildStudent({ classId: 'old' }), buildClass(), 5);
    await service.assignClass('s-1', 'c-1', actor);
    expect(tx.history.update).toHaveBeenCalledWith(
      expect.objectContaining({ studentId: 's-1', classId: 'old' }),
      expect.objectContaining({ removedAt: expect.any(Date) }),
    );
  });

  it('should_skip_history_write_when_reassigning_to_same_class', async () => {
    const { service, tx } = buildService(buildStudent({ classId: 'c-1' }), buildClass(), 5);
    await service.assignClass('s-1', 'c-1', actor);
    expect(tx.history.save).not.toHaveBeenCalled();
    expect(tx.history.update).not.toHaveBeenCalled();
  });
});

describe('StudentsService.archive', () => {
  const makeService = (student: Student | null) => {
    const tx: TxRepos = {
      student: makeStudentRepo(student),
      classes: makeClassesRepo(null),
      history: makeHistoryRepo(),
    };
    const dataSource = buildDataSource(tx);
    const studentsRepo = {} as unknown as Repository<Student>;
    const classesRepo = {} as unknown as Repository<ClassEntity>;
    const codes = {} as unknown as StudentCodeService;
    return { service: new StudentsService(studentsRepo, classesRepo, dataSource, codes), tx };
  };

  it('should_flip_status_and_close_open_history_row', async () => {
    const { service, tx } = makeService(buildStudent({ classId: 'c-1' }));
    const result = await service.archive('s-1', 'Oiladan ketdi');
    expect(result.status).toBe(StudentStatus.INACTIVE);
    expect(result.leftReason).toBe('Oiladan ketdi');
    expect(result.classId).toBeNull();
    expect(tx.history.update).toHaveBeenCalled();
  });

  it('should_throw_when_student_is_already_archived', async () => {
    const { service } = makeService(buildStudent({ status: StudentStatus.INACTIVE }));
    await expect(service.archive('s-1', 'again')).rejects.toThrow(/already archived/);
  });
});

describe('StudentsService.update', () => {
  const makeService = () => {
    const studentsRepo = {
      findOne: jest.fn(),
      save: jest.fn(async (e) => e as Student),
    } as unknown as Repository<Student>;
    const classesRepo = {} as unknown as Repository<ClassEntity>;
    const dataSource = {} as unknown as DataSource;
    const codes = {} as unknown as StudentCodeService;
    return {
      service: new StudentsService(studentsRepo, classesRepo, dataSource, codes),
      studentsRepo: studentsRepo as unknown as { findOne: jest.Mock; save: jest.Mock },
    };
  };

  it('should_block_grade_level_change_while_student_is_in_class', async () => {
    const { service, studentsRepo } = makeService();
    studentsRepo.findOne.mockResolvedValue(buildStudent({ classId: 'c-1', gradeLevel: 4 }));
    await expect(service.update('s-1', { gradeLevel: 5 })).rejects.toThrow(
      /Remove the student from their class/,
    );
  });

  it('should_allow_grade_level_change_when_student_has_no_class', async () => {
    const { service, studentsRepo } = makeService();
    studentsRepo.findOne.mockResolvedValue(buildStudent({ classId: null, gradeLevel: 4 }));
    const result = await service.update('s-1', { gradeLevel: 5 });
    expect(result.gradeLevel).toBe(5);
  });
});
