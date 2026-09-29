import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from './payment.entity';

@Entity({ name: 'payment_transactions' })
@Index('idx_payment_transactions_provider_trans', ['provider', 'providerTransId'], { unique: true })
@Index('idx_payment_transactions_student', ['studentId'])
@Index('idx_payment_transactions_status', ['status'])
export class PaymentTransaction extends BaseEntity {
  @Column({ name: 'provider', type: 'varchar', length: 20 })
  provider!: 'PAYME' | 'CLICK';

  @Column({ name: 'provider_trans_id', type: 'varchar', length: 100 })
  providerTransId!: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'student_code', type: 'varchar', length: 20 })
  studentCode!: string;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column({ name: 'state', type: 'int', default: 0 })
  state!: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'PENDING' })
  status!: 'PENDING' | 'SUCCESS' | 'CANCELLED' | 'FAILED';

  @Column({ name: 'payment_record_id', type: 'uuid', nullable: true })
  paymentRecordId!: string | null;

  @ManyToOne(() => PaymentRecord, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'payment_record_id' })
  paymentRecord!: PaymentRecord | null;

  @Column({ name: 'perform_time', type: 'timestamptz', nullable: true })
  performTime!: Date | null;

  @Column({ name: 'cancel_time', type: 'timestamptz', nullable: true })
  cancelTime!: Date | null;

  @Column({ name: 'reason', type: 'int', nullable: true })
  reason!: number | null;

  @Column({ name: 'meta', type: 'jsonb', nullable: true })
  meta!: Record<string, unknown> | null;
}
