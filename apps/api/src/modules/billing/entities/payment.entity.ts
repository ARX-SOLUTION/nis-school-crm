import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { Student } from '../../students/entities/student.entity';
import { type PaymentMethod, type PaymentStatus } from '@nis/shared';

@Entity({ name: 'payments' })
@Index('idx_payments_student_month', ['studentId', 'month'])
@Index('idx_payments_month_status', ['month', 'status'])
@Index('idx_payments_receipt', ['receiptNumber'], { unique: true })
export class PaymentRecord extends BaseEntity {
  @Column({ name: 'student_id', type: 'uuid' })
  studentId!: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: Student;

  @Column({ name: 'amount', type: 'numeric', precision: 14, scale: 2 })
  amount!: number;

  @Column({
    name: 'method',
    type: 'varchar',
    length: 20,
    default: 'CASH',
  })
  method!: PaymentMethod;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: 'CONFIRMED',
  })
  status!: PaymentStatus;

  @Column({ name: 'receipt_number', type: 'varchar', length: 50, unique: true })
  receiptNumber!: string;

  @Column({ name: 'month', type: 'varchar', length: 7 })
  month!: string; // YYYY-MM

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @Column({ name: 'comment', type: 'text', nullable: true })
  comment!: string | null;
}
