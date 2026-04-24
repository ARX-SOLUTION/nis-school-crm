import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import type { RoomType } from '@nis/shared';

@Entity({ name: 'rooms' })
@Index('idx_rooms_active', ['isActive'], { where: '"deleted_at" IS NULL' })
export class Room extends BaseEntity {
  /**
   * Short display label for the room (e.g. "201", "Lab-A").
   */
  @Column({ name: 'room_number', type: 'varchar', length: 20, unique: true })
  roomNumber!: string;

  /**
   * Optional longer descriptive name.
   */
  @Column({ name: 'name', type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  /**
   * Maximum student capacity.
   * DB CHECK: BETWEEN 1 AND 500.
   */
  @Column({ name: 'capacity', type: 'int', default: 30 })
  capacity!: number;

  /**
   * Room type. DB CHECK: one of ROOM_TYPES values.
   */
  @Column({ name: 'type', type: 'varchar', length: 30, default: 'CLASSROOM' })
  type!: RoomType;

  @Column({ name: 'floor', type: 'int', nullable: true })
  floor!: number | null;

  /**
   * Soft-disable: inactive rooms are hidden from scheduling dropdowns.
   * Distinct from soft-delete (deletedAt).
   */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
