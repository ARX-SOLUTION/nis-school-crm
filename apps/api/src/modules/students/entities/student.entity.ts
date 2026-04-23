import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  GRADUATED = 'GRADUATED',
}

export enum StudentGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

@Entity({ name: 'students' })
@Index('idx_students_class', ['classId'], { where: '"deleted_at" IS NULL' })
@Index('idx_students_status', ['status'])
@Index('idx_students_grade', ['gradeLevel'])
@Index('idx_students_code', ['studentCode'], { unique: true })
export class Student extends BaseEntity {
  @Column({ name: 'student_code', type: 'varchar', length: 20, unique: true })
  studentCode!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ name: 'middle_name', type: 'varchar', length: 100, nullable: true })
  middleName!: string | null;

  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string;

  @Column({ name: 'gender', type: 'enum', enum: StudentGender, nullable: true })
  gender!: StudentGender | null;

  @Column({ name: 'grade_level', type: 'int' })
  gradeLevel!: number;

  @ManyToOne(() => ClassEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'class_id' })
  class!: ClassEntity | null;

  @Column({ name: 'class_id', type: 'uuid', nullable: true })
  classId!: string | null;

  @Column({ name: 'status', type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIVE })
  status!: StudentStatus;

  @Column({ name: 'parent_full_name', type: 'varchar', length: 200, nullable: true })
  parentFullName!: string | null;

  @Column({ name: 'parent_phone', type: 'varchar', length: 20, nullable: true })
  parentPhone!: string | null;

  @Column({ name: 'parent_telegram', type: 'varchar', length: 100, nullable: true })
  parentTelegram!: string | null;

  @Column({ name: 'address', type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'blood_group', type: 'varchar', length: 5, nullable: true })
  bloodGroup!: string | null;

  @Column({ name: 'medical_notes', type: 'text', nullable: true })
  medicalNotes!: string | null;

  @Column({ name: 'enrolled_at', type: 'timestamptz', default: () => 'now()' })
  enrolledAt!: Date;

  @Column({ name: 'left_at', type: 'timestamptz', nullable: true })
  leftAt!: Date | null;

  @Column({ name: 'left_reason', type: 'varchar', length: 500, nullable: true })
  leftReason!: string | null;
}
