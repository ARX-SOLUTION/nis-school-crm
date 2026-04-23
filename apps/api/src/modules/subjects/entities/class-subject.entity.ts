import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import { Subject } from './subject.entity';

/**
 * Assigns a Subject to a Class for a given academic year, with an assigned
 * teacher (User with role TEACHER — enforced at the service layer, not DB).
 *
 * UNIQUE(class_id, subject_id, academic_year) prevents duplicate subject
 * assignments per year. The teacher column is intentionally outside the
 * unique key so that swapping teachers does not create a duplicate row.
 */
@Entity({ name: 'class_subjects' })
@Unique('uq_class_subjects_class_subject_year', ['classId', 'subjectId', 'academicYear'])
@Index('idx_class_subjects_class', ['classId'])
@Index('idx_class_subjects_teacher', ['teacherId'])
@Index('idx_class_subjects_subject_year', ['subjectId', 'academicYear'])
export class ClassSubject extends BaseEntity {
  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @Column({ name: 'class_id', type: 'uuid' })
  classId!: string;

  @ManyToOne(() => Subject, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: User;

  @Column({ name: 'teacher_id', type: 'uuid' })
  teacherId!: string;

  /**
   * Weekly hours override for this specific class+subject.
   * DB CHECK: BETWEEN 1 AND 40.
   */
  @Column({ name: 'hours_per_week', type: 'int', default: 2 })
  hoursPerWeek!: number;

  /**
   * Academic year in the format "2025-2026".
   * DB CHECK: academic_year ~ '^[0-9]{4}-[0-9]{4}$'
   */
  @Column({ name: 'academic_year', type: 'varchar', length: 10 })
  academicYear!: string;
}
