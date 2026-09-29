import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Room } from '../../rooms/entities/room.entity';
import { User } from '../../users/entities/user.entity';
import { ClubCategory, ClubFeeType, ClubStatus } from '@nis/shared';
import { ClubSchedule } from './club-schedule.entity';
import { ClubEnrollment } from './club-enrollment.entity';
import { ClubAttendance } from './club-attendance.entity';

@Entity({ name: 'clubs' })
@Index('idx_clubs_branch', ['branchId'])
@Index('idx_clubs_category', ['category'])
@Index('idx_clubs_status', ['status'])
export class Club extends BaseEntity {
  @Column({ name: 'name', type: 'varchar', length: 150 })
  name!: string;

  @Column({
    name: 'category',
    type: 'varchar',
    length: 50,
    default: ClubCategory.STEM_ROBOTICS,
  })
  category!: ClubCategory;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId!: string | null;

  @ManyToOne(() => Branch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch | null;

  @Column({ name: 'instructor_id', type: 'uuid', nullable: true })
  instructorId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'instructor_id' })
  instructor!: User | null;

  @Column({ name: 'instructor_name', type: 'varchar', length: 150, nullable: true })
  instructorName!: string | null;

  @Column({ name: 'instructor_phone', type: 'varchar', length: 30, nullable: true })
  instructorPhone!: string | null;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId!: string | null;

  @ManyToOne(() => Room, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'room_id' })
  room!: Room | null;

  @Column({ name: 'capacity', type: 'int', default: 15 })
  capacity!: number;

  @Column({ name: 'min_grade', type: 'int', default: 1 })
  minGrade!: number;

  @Column({ name: 'max_grade', type: 'int', default: 11 })
  maxGrade!: number;

  @Column({
    name: 'fee_type',
    type: 'varchar',
    length: 20,
    default: ClubFeeType.FREE,
  })
  feeType!: ClubFeeType;

  @Column({ name: 'monthly_fee', type: 'numeric', precision: 14, scale: 2, default: 0 })
  monthlyFee!: number;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: ClubStatus.ACTIVE,
  })
  status!: ClubStatus;

  @OneToMany(() => ClubSchedule, (schedule) => schedule.club, { cascade: true })
  schedules!: ClubSchedule[];

  @OneToMany(() => ClubEnrollment, (enrollment) => enrollment.club)
  enrollments!: ClubEnrollment[];

  @OneToMany(() => ClubAttendance, (attendance) => attendance.club)
  attendances!: ClubAttendance[];
}
