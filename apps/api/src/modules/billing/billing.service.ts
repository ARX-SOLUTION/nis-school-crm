import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  BillingStatsDto,
  DebtorStudentDto,
  PaginatedResponse,
  PaymentRecordDto,
} from '@nis/shared';
import { EVENT_PAYMENT_RECORDED, PaymentRecordedEvent } from '../../common/events/contracts';
import { EventBusService } from '../../common/events/event-bus.service';
import { Student, StudentStatus } from '../students/entities/student.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';
import { PaymentRecord } from './entities/payment.entity';

const DEFAULT_MONTHLY_FEE = 2_500_000;

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(PaymentRecord)
    private readonly paymentRepo: Repository<PaymentRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @Optional() private readonly eventBus?: EventBusService,
  ) {}

  async recordPayment(dto: CreatePaymentDto): Promise<PaymentRecordDto> {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
      relations: ['class'],
    });

    if (!student) {
      throw new NotFoundException(`Student with id ${dto.studentId} not found`);
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `REC-${dto.month.replace('-', '')}-${randomSuffix}`;

    const payment = this.paymentRepo.create({
      studentId: dto.studentId,
      amount: dto.amount,
      method: dto.method,
      status: 'CONFIRMED',
      receiptNumber,
      month: dto.month,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      comment: dto.comment ?? null,
    });

    const saved = await this.paymentRepo.save(payment);

    if (this.eventBus) {
      await this.eventBus
        .publish<PaymentRecordedEvent>(EVENT_PAYMENT_RECORDED, {
          studentId: saved.studentId,
          studentName: `${student.lastName} ${student.firstName}`,
          amount: Number(saved.amount),
          method: saved.method,
          receiptNumber: saved.receiptNumber,
          month: saved.month,
          paidAt: saved.paidAt,
        })
        .catch(() => {});
    }

    return {
      id: saved.id,
      studentId: saved.studentId,
      studentName: `${student.lastName} ${student.firstName}`,
      studentCode: student.studentCode,
      className: student.class?.name ?? null,
      amount: Number(saved.amount),
      method: saved.method,
      status: saved.status,
      receiptNumber: saved.receiptNumber,
      month: saved.month,
      paidAt: saved.paidAt,
      comment: saved.comment,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async listPayments(query: PaymentsQueryDto): Promise<PaginatedResponse<PaymentRecordDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.paymentRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.student', 'student')
      .leftJoinAndSelect('student.class', 'class');

    if (query.studentId) {
      qb.andWhere('p.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.month) {
      qb.andWhere('p.month = :month', { month: query.month });
    }
    if (query.method) {
      qb.andWhere('p.method = :method', { method: query.method });
    }
    if (query.status) {
      qb.andWhere('p.status = :status', { status: query.status });
    }

    qb.orderBy('p.paidAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        studentName: p.student ? `${p.student.lastName} ${p.student.firstName}` : undefined,
        studentCode: p.student?.studentCode,
        className: p.student?.class?.name ?? null,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        receiptNumber: p.receiptNumber,
        month: p.month,
        paidAt: p.paidAt,
        comment: p.comment,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(month?: string): Promise<BillingStatsDto> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    // Sum of confirmed payments for targetMonth
    const { totalCollected } = await this.paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'totalCollected')
      .where('p.month = :month', { month: targetMonth })
      .andWhere('p.status = :status', { status: 'CONFIRMED' })
      .getRawOne();

    const activeStudents = await this.studentRepo.count({
      where: { status: StudentStatus.ACTIVE },
    });

    const expected = activeStudents * DEFAULT_MONTHLY_FEE;
    const collected = Number(totalCollected);

    // Count debtors
    const debtors = await this.getDebtors(targetMonth);

    return {
      totalCollectedThisMonth: collected,
      expectedThisMonth: expected,
      debtorCount: debtors.length,
      collectionRate: expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0,
      month: targetMonth,
    };
  }

  async getDebtors(month?: string): Promise<DebtorStudentDto[]> {
    const targetMonth = month || new Date().toISOString().slice(0, 7);

    const activeStudents = await this.studentRepo.find({
      where: { status: StudentStatus.ACTIVE },
      relations: ['class'],
      order: { lastName: 'ASC' },
    });

    if (activeStudents.length === 0) return [];

    // Payments per student in targetMonth
    const payments = await this.paymentRepo
      .createQueryBuilder('p')
      .select('p.studentId', 'studentId')
      .addSelect('SUM(p.amount)', 'totalPaid')
      .where('p.month = :month', { month: targetMonth })
      .andWhere('p.status = :status', { status: 'CONFIRMED' })
      .groupBy('p.studentId')
      .getRawMany();

    const paidMap = new Map<string, number>();
    for (const p of payments) {
      paidMap.set(p.studentId, Number(p.totalPaid));
    }

    const debtors: DebtorStudentDto[] = [];
    for (const student of activeStudents) {
      const paid = paidMap.get(student.id) ?? 0;
      if (paid < DEFAULT_MONTHLY_FEE) {
        debtors.push({
          studentId: student.id,
          studentName: `${student.lastName} ${student.firstName}`,
          studentCode: student.studentCode,
          className: student.class?.name ?? null,
          parentPhone: student.parentPhone ?? null,
          monthlyFee: DEFAULT_MONTHLY_FEE,
          paidAmount: paid,
          debtAmount: DEFAULT_MONTHLY_FEE - paid,
          month: targetMonth,
        });
      }
    }

    return debtors.sort((a, b) => b.debtAmount - a.debtAmount);
  }
}
