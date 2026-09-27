import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { User } from '../../users/entities/user.entity';
import type { AttendanceStatus } from '@nis/shared';

@Entity({ name: 'attendance_records' })
@Index('idx_attendance_class_date', ['classId', 'date'])
@Index('idx_attendance_student_date', ['studentId', 'date'], { unique: true })
export class AttendanceRecord extends BaseEntity {
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

  @Column({ name: 'date', type: 'date' })
  date!: string;

  @Column({ name: 'status', type: 'varchar', length: 15, default: 'PRESENT' })
  status!: AttendanceStatus;

  @Column({ name: 'remarks', type: 'varchar', length: 255, nullable: true })
  remarks!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy!: User | null;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById!: string | null;
}
