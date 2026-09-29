import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { EVENT_PAYMENT_RECORDED, PaymentRecordedEvent } from '../../../common/events/contracts';
import { EventBusService } from '../../../common/events/event-bus.service';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

export interface ClickRequest {
  click_trans_id: string | number;
  service_id: string | number;
  click_paydoc_id: string | number;
  merchant_trans_id: string; // studentCode
  amount: number;
  action: number; // 0 = Prepare, 1 = Complete
  error: number;
  error_note?: string;
  sign_time: string;
  sign_string: string;
  merchant_prepare_id?: string;
}

export interface ClickResponse {
  click_trans_id: string | number;
  merchant_trans_id: string;
  merchant_prepare_id?: string;
  merchant_confirm_id?: string;
  error: number;
  error_note: string;
}

@Injectable()
export class ClickService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRepo: Repository<PaymentRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @Optional() private readonly eventBus?: EventBusService,
  ) {}

  async handleRequest(dto: ClickRequest, secretKey?: string): Promise<ClickResponse> {
    const clickTransId = String(dto.click_trans_id);
    const serviceId = String(dto.service_id);
    const studentCode = dto.merchant_trans_id;
    const amount = Number(dto.amount);
    const action = Number(dto.action);
    const signTime = dto.sign_time;
    const signString = dto.sign_string;
    const merchantPrepareId = dto.merchant_prepare_id;

    // Optional MD5 Signature verification if secretKey is provided
    if (secretKey) {
      let expectedSign: string;
      if (action === 0) {
        // Prepare: MD5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
        const raw = `${clickTransId}${serviceId}${secretKey}${studentCode}${amount}${action}${signTime}`;
        expectedSign = crypto.createHash('md5').update(raw).digest('hex');
      } else {
        // Complete: MD5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
        const raw = `${clickTransId}${serviceId}${secretKey}${studentCode}${merchantPrepareId ?? ''}${amount}${action}${signTime}`;
        expectedSign = crypto.createHash('md5').update(raw).digest('hex');
      }

      if (expectedSign.toLowerCase() !== signString.toLowerCase()) {
        return {
          click_trans_id: clickTransId,
          merchant_trans_id: studentCode,
          error: -1,
          error_note: 'SIGN CHECK FAILED',
        };
      }
    }

    if (action === 0) {
      return await this.prepare(clickTransId, studentCode, amount, dto);
    } else if (action === 1) {
      return await this.complete(clickTransId, studentCode, amount, merchantPrepareId, dto);
    } else {
      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        error: -3,
        error_note: 'Action not found',
      };
    }
  }

  private async prepare(
    clickTransId: string,
    studentCode: string,
    amount: number,
    rawDto: ClickRequest,
  ): Promise<ClickResponse> {
    if (!amount || amount <= 0) {
      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        error: -2,
        error_note: 'Incorrect parameter amount',
      };
    }

    const student = await this.studentRepo.findOne({
      where: { studentCode },
      relations: ['class'],
    });

    if (!student) {
      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        error: -5,
        error_note: 'User does not exist',
      };
    }

    // Check existing transaction
    let trans = await this.transRepo.findOne({
      where: { provider: 'CLICK', providerTransId: clickTransId },
    });

    if (!trans) {
      trans = this.transRepo.create({
        provider: 'CLICK',
        providerTransId: clickTransId,
        studentId: student.id,
        studentCode: student.studentCode,
        amount,
        state: 0,
        status: 'PENDING',
        meta: {
          click_paydoc_id: rawDto.click_paydoc_id,
          sign_time: rawDto.sign_time,
          studentName: `${student.lastName} ${student.firstName}`,
          className: student.class?.name ?? null,
        },
      });
      trans = await this.transRepo.save(trans);
    }

    return {
      click_trans_id: clickTransId,
      merchant_trans_id: studentCode,
      merchant_prepare_id: trans.id,
      error: 0,
      error_note: 'Success',
    };
  }

  private async complete(
    clickTransId: string,
    studentCode: string,
    amount: number,
    merchantPrepareId: string | undefined,
    rawDto: ClickRequest,
  ): Promise<ClickResponse> {
    // Find transaction by merchantPrepareId or clickTransId
    let trans = merchantPrepareId
      ? await this.transRepo.findOne({ where: { id: merchantPrepareId } })
      : null;

    if (!trans) {
      trans = await this.transRepo.findOne({
        where: { provider: 'CLICK', providerTransId: clickTransId },
      });
    }

    if (!trans) {
      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        error: -6,
        error_note: 'Transaction does not exist',
      };
    }

    if (trans.status === 'SUCCESS' && trans.state === 1) {
      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        merchant_confirm_id: trans.id,
        error: 0,
        error_note: 'Already paid',
      };
    }

    if (Number(rawDto.error) < 0) {
      trans.status = 'FAILED';
      trans.state = -1;
      trans.cancelTime = new Date();
      await this.transRepo.save(trans);

      return {
        click_trans_id: clickTransId,
        merchant_trans_id: studentCode,
        error: -9,
        error_note: 'Transaction cancelled',
      };
    }

    const now = new Date();
    trans.state = 1;
    trans.status = 'SUCCESS';
    trans.performTime = now;

    const currentMonth = now.toISOString().slice(0, 7);
    const receiptNumber = `CLICK-${clickTransId}`;

    const payment = this.paymentRepo.create({
      studentId: trans.studentId,
      amount: trans.amount,
      method: 'CLICK',
      status: 'CONFIRMED',
      receiptNumber,
      month: currentMonth,
      paidAt: now,
      comment: `Avtomatlashtirilgan Click to'lovi (Trans ID: ${clickTransId})`,
    });

    const savedPayment = await this.paymentRepo.save(payment);
    trans.paymentRecordId = savedPayment.id;
    await this.transRepo.save(trans);

    if (this.eventBus) {
      const student = await this.studentRepo.findOne({ where: { id: trans.studentId } });
      await this.eventBus
        .publish<PaymentRecordedEvent>(EVENT_PAYMENT_RECORDED, {
          studentId: trans.studentId,
          studentName: student ? `${student.lastName} ${student.firstName}` : trans.studentCode,
          amount: Number(savedPayment.amount),
          method: savedPayment.method,
          receiptNumber: savedPayment.receiptNumber,
          month: savedPayment.month,
          paidAt: savedPayment.paidAt,
        })
        .catch(() => {});
    }

    return {
      click_trans_id: clickTransId,
      merchant_trans_id: studentCode,
      merchant_confirm_id: trans.id,
      error: 0,
      error_note: 'Success',
    };
  }
}
