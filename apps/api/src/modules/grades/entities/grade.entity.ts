import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';
import type { GradeType } from '@nis/shared';

@Entity({ name: 'grades' })
@Index('idx_grades_student_subject', ['studentId', 'subjectId'])
@Index('idx_grades_class_date', ['classId', 'date'])
export class GradeRecord extends BaseEntity {
  @ManyToOne(() => Student, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity;

  @Column({ name: 'class_id', type: 'uuid' })
  classId!: string;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject!: Subject;

  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Column({ name: 'date', type: 'date' })
  date!: string;

  @Column({ name: 'score', type: 'numeric', precision: 5, scale: 2 })
  score!: number;

  @Column({ name: 'max_score', type: 'numeric', precision: 5, scale: 2, default: 5 })
  maxScore!: number;

  @Column({ name: 'grade_type', type: 'varchar', length: 20, default: 'CLASSWORK' })
  gradeType!: GradeType;

  @Column({ name: 'comment', type: 'varchar', length: 255, nullable: true })
  comment!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher!: User | null;

  @Column({ name: 'teacher_id', type: 'uuid', nullable: true })
  teacherId!: string | null;
}
