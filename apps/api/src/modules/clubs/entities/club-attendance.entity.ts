import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { User } from '../../users/entities/user.entity';
import { ClubAttendanceStatus } from '@nis/shared';
import { Club } from './club.entity';

@Entity({ name: 'club_attendance' })
@Index('idx_club_attendance_club_date', ['clubId', 'date'])
export class ClubAttendance extends BaseEntity {
  @Column({ name: 'club_id', type: 'uuid' })
  clubId!: string;

  @ManyToOne(() => Club, (club) => club.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club!: Club;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'date', type: 'date' })
  date!: string; // YYYY-MM-DD

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: ClubAttendanceStatus.PRESENT,
  })
  status!: ClubAttendanceStatus;

  @Column({ name: 'remarks', type: 'varchar', length: 255, nullable: true })
  remarks!: string | null;

  @Column({ name: 'recorded_by_id', type: 'uuid', nullable: true })
  recordedById!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy!: User | null;
}
