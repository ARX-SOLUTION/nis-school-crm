import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Room } from '../../rooms/entities/room.entity';
import { Club } from './club.entity';

@Entity({ name: 'club_schedules' })
@Index('idx_club_schedules_club', ['clubId'])
@Index('idx_club_schedules_day_room', ['dayOfWeek', 'roomId'])
export class ClubSchedule extends BaseEntity {
  @Column({ name: 'club_id', type: 'uuid' })
  clubId!: string;

  @ManyToOne(() => Club, (club) => club.schedules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club!: Club;

  @Column({ name: 'day_of_week', type: 'int' })
  dayOfWeek!: number; // 1 = Dushanba, ..., 6 = Shanba

  @Column({ name: 'start_time', type: 'varchar', length: 10 })
  startTime!: string; // e.g. "15:30"

  @Column({ name: 'end_time', type: 'varchar', length: 10 })
  endTime!: string; // e.g. "17:00"

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId!: string | null;

  @ManyToOne(() => Room, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'room_id' })
  room!: Room | null;
}
