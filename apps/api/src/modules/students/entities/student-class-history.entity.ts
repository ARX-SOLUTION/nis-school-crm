import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Student } from './student.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'student_class_history' })
@Index('idx_sch_student', ['studentId'])
@Index('idx_sch_class', ['classId'])
export class StudentClassHistory extends BaseEntity {
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

  @Column({ name: 'assigned_at', type: 'timestamptz', default: () => 'now()' })
  assignedAt!: Date;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt!: Date | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedBy!: User | null;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assignedById!: string | null;

  @Column({ name: 'reason', type: 'varchar', length: 255, nullable: true })
  reason!: string | null;
}
