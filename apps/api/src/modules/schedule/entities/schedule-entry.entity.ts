import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { ClassEntity } from '../../classes/entities/class.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';
import type { DayOfWeek } from '@nis/shared';
import { ScheduleSubstitution } from './schedule-substitution.entity';

@Entity({ name: 'schedule_entries' })
@Index('idx_schedule_entries_class', ['classId'])
@Index('idx_schedule_entries_teacher_day', ['teacherId', 'dayOfWeek'])
@Index('idx_schedule_entries_room_day', ['roomId', 'dayOfWeek'])
@Index('idx_schedule_entries_active', ['isActive'], { where: '"deleted_at" IS NULL' })
export class ScheduleEntry extends BaseEntity {
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

  @ManyToOne(() => Room, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'room_id' })
  room!: Room;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId!: string;

  @Column({ name: 'day_of_week', type: 'varchar', length: 10 })
  dayOfWeek!: DayOfWeek;

  @Column({ name: 'lesson_number', type: 'int' })
  lessonNumber!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'effective_from', type: 'date' })
  effectiveFrom!: string;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  effectiveTo!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => ScheduleSubstitution, (sub) => sub.originalEntry)
  substitutions?: ScheduleSubstitution[];
}
