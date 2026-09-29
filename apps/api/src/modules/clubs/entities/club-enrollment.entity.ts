import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { EnrollmentStatus } from '@nis/shared';
import { Club } from './club.entity';

@Entity({ name: 'club_enrollments' })
@Index('idx_club_enrollments_club', ['clubId'])
@Index('idx_club_enrollments_student', ['studentId'])
export class ClubEnrollment extends BaseEntity {
  @Column({ name: 'club_id', type: 'uuid' })
  clubId!: string;

  @ManyToOne(() => Club, (club) => club.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club!: Club;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'enrolled_at', type: 'timestamptz', default: () => 'now()' })
  enrolledAt!: Date;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: EnrollmentStatus.ACTIVE,
  })
  status!: EnrollmentStatus;

  @Column({ name: 'dropped_at', type: 'timestamptz', nullable: true })
  droppedAt!: Date | null;

  @Column({ name: 'drop_reason', type: 'varchar', length: 255, nullable: true })
  dropReason!: string | null;
}
