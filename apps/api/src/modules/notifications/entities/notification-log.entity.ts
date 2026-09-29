import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { NotificationChannel, NotificationTarget, NotificationType } from '@nis/shared';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 50, default: 'ANNOUNCEMENT' })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 50, default: 'ALL_USERS' })
  target!: NotificationTarget;

  @Column({ type: 'varchar', length: 50, default: 'TELEGRAM' })
  channel!: NotificationChannel;

  @Column({ type: 'int', default: 0 })
  recipientCount!: number;

  @Column({ type: 'uuid', nullable: true })
  classId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  sentByUserId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sentByName?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
