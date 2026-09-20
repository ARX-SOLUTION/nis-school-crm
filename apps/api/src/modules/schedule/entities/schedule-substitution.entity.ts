import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduleEntry } from './schedule-entry.entity';
import type { SubstitutionStatus } from '@nis/shared';

@Entity({ name: 'schedule_substitutions' })
@Unique('uq_schedule_substitutions_entry_date', ['originalEntryId', 'date'])
@Index('idx_schedule_substitutions_date', ['date'])
@Index('idx_schedule_substitutions_teacher', ['substituteTeacherId'])
@Index('idx_schedule_substitutions_entry', ['originalEntryId'])
export class ScheduleSubstitution extends BaseEntity {
  @ManyToOne(() => ScheduleEntry, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'original_entry_id' })
  originalEntry!: ScheduleEntry;

  @Column({ name: 'original_entry_id', type: 'uuid' })
  originalEntryId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'substitute_teacher_id' })
  substituteTeacher!: User;

  @Column({ name: 'substitute_teacher_id', type: 'uuid' })
  substituteTeacherId!: string;

  @Column({ name: 'date', type: 'date' })
  date!: string;

  @Column({ name: 'reason', type: 'varchar', length: 500, nullable: true })
  reason!: string | null;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'CONFIRMED' })
  status!: SubstitutionStatus;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy!: User | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById!: string | null;
}
