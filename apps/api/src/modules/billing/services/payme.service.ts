import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EVENT_PAYMENT_RECORDED, PaymentRecordedEvent } from '../../../common/events/contracts';
import { EventBusService } from '../../../common/events/event-bus.service';
import { Student } from '../../students/entities/student.entity';
import { PaymentRecord } from '../entities/payment.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

export interface PaymeRpcRequest {
  method: string;
  params: Record<string, unknown>;
  id: number | string;
}

export interface PaymeRpcResponse {
  result?: Record<string, unknown>;
  error?: {
    code: number;
    message: {
      uz: string;
      ru: string;
      en: string;
    };
    data?: unknown;
  };
  id: number | string;
}

const TIMEOUT_MS = 43_200_000; // 12 hours

@Injectable()
export class PaymeService {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly transRepo: Repository<PaymentTransaction>,
    @InjectRepository(PaymentRecord)
    private readonly paymentRepo: Repository<PaymentRecord>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @Optional() private readonly eventBus?: EventBusService,
  ) {}

  async handleRpc(request: PaymeRpcRequest): Promise<PaymeRpcResponse> {
    const { method, params, id } = request;

    try {
      switch (method) {
        case 'CheckPerformTransaction':
          return await this.checkPerformTransaction(params, id);
        case 'CreateTransaction':
          return await this.createTransaction(params, id);
        case 'PerformTransaction':
          return await this.performTransaction(params, id);
        case 'CancelTransaction':
          return await this.cancelTransaction(params, id);
        case 'CheckTransaction':
          return await this.checkTransaction(params, id);
        case 'GetStatement':
          return await this.getStatement(params, id);
        default:
          return {
            error: {
              code: -32601,
              message: {
                uz: 'Metod topilmadi',
                ru: 'Метод не найден',
                en: 'Method not found',
              },
            },
            id,
          };
      }
    } catch {
      return {
        error: {
          code: -32400,
          message: {
            uz: 'Tizim xatoligi',
            ru: 'Системная ошибка',
            en: 'Internal system error',
          },
        },
        id,
      };
    }
  }

  private async checkPerformTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const account = params?.account as Record<string, unknown> | undefined;
    const studentCode = (account?.student_code || account?.studentCode) as string | undefined;
    const amount = Number(params?.amount);

    if (!amount || amount <= 0) {
      return {
        error: {
          code: -31001,
          message: {
            uz: "Noto'g'ri summa",
            ru: 'Неверная сумма',
            en: 'Incorrect amount',
          },
        },
        id,
      };
    }

    if (!studentCode) {
      return {
        error: {
          code: -31050,
          message: {
            uz: "O'quvchi kodi kiritilmagan",
            ru: 'Не указан код ученика',
            en: 'Student code is required',
          },
          data: 'student_code',
        },
        id,
      };
    }

    const student = await this.studentRepo.findOne({
      where: { studentCode },
      relations: ['class'],
    });

    if (!student) {
      return {
        error: {
          code: -31050,
          message: {
            uz: "O'quvchi topilmadi",
            ru: 'Ученик не найден',
            en: 'Student not found',
          },
          data: 'student_code',
        },
        id,
      };
    }

    return {
      result: {
        allow: true,
        detail: {
          receipt_type: 0,
          items: [
            {
              title: `O'qish to'lovi: ${student.lastName} ${student.firstName} (${student.class?.name || 'Sinf'})`,
              price: amount,
              count: 1,
              code: '10899001001000000',
              units: 241092,
              vat_percent: 0,
              package_code: '123456',
            },
          ],
        },
      },
      id,
    };
  }

  private async createTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const paymeTransId = String(params?.id ?? '');
    const time = Number(params?.time);
    const amount = Number(params?.amount);
    const account = params?.account as Record<string, unknown> | undefined;
    const studentCode = (account?.student_code || account?.studentCode) as string | undefined;

    // Check existing transaction by paymeTransId
    const existing = await this.transRepo.findOne({
      where: { provider: 'PAYME', providerTransId: paymeTransId },
    });

    if (existing) {
      if (existing.state === 1) {
        const createTime = Number(existing.meta?.time || existing.createdAt.getTime());
        if (Date.now() - createTime > TIMEOUT_MS) {
          existing.state = -1;
          existing.status = 'CANCELLED';
          existing.reason = 4;
          await this.transRepo.save(existing);
          return {
            error: {
              code: -31008,
              message: {
                uz: 'Tranzaksiya muddati otdi',
                ru: 'Транзакция просрочена',
                en: 'Transaction timed out',
              },
            },
            id,
          };
        }

        return {
          result: {
            create_time: createTime,
            transaction: existing.id,
            state: existing.state,
          },
          id,
        };
      }

      return {
        result: {
          create_time: Number(existing.meta?.time || existing.createdAt.getTime()),
          transaction: existing.id,
          state: existing.state,
        },
        id,
      };
    }

    // Verify student and amount
    const checkRes = await this.checkPerformTransaction(params, id);
    if (checkRes.error) {
      return checkRes;
    }

    const student = await this.studentRepo.findOne({
      where: { studentCode },
      relations: ['class'],
    });

    if (!student) {
      return {
        error: {
          code: -31050,
          message: {
            uz: "O'quvchi topilmadi",
            ru: 'Ученик не найден',
            en: 'Student not found',
          },
          data: 'student_code',
        },
        id,
      };
    }

    const newTrans = this.transRepo.create({
      provider: 'PAYME',
      providerTransId: paymeTransId,
      studentId: student.id,
      studentCode: student.studentCode,
      amount: amount / 100, // convert tiyin to UZS
      state: 1,
      status: 'PENDING',
      meta: {
        time,
        account: params?.account,
        studentName: `${student.lastName} ${student.firstName}`,
        className: student.class?.name ?? null,
      },
    });

    const saved = await this.transRepo.save(newTrans);

    return {
      result: {
        create_time: time,
        transaction: saved.id,
        state: saved.state,
      },
      id,
    };
  }

  private async performTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const paymeTransId = String(params?.id ?? '');

    const trans = await this.transRepo.findOne({
      where: { provider: 'PAYME', providerTransId: paymeTransId },
      relations: ['student'],
    });

    if (!trans) {
      return {
        error: {
          code: -31007,
          message: {
            uz: 'Tranzaksiya topilmadi',
            ru: 'Транзакция не найдена',
            en: 'Transaction not found',
          },
        },
        id,
      };
    }

    if (trans.state === 1) {
      const createTime = Number(trans.meta?.time || trans.createdAt.getTime());
      if (Date.now() - createTime > TIMEOUT_MS) {
        trans.state = -1;
        trans.status = 'CANCELLED';
        trans.reason = 4;
        await this.transRepo.save(trans);
        return {
          error: {
            code: -31008,
            message: {
              uz: 'Tranzaksiya muddati otdi',
              ru: 'Транзакция просрочена',
              en: 'Transaction timed out',
            },
          },
          id,
        };
      }

      const now = new Date();
      trans.state = 2;
      trans.status = 'SUCCESS';
      trans.performTime = now;

      const currentMonth = now.toISOString().slice(0, 7);
      const receiptNumber = `PAYME-${paymeTransId}`;

      // Create PaymentRecord in NIS CRM billing
      const payment = this.paymentRepo.create({
        studentId: trans.studentId,
        amount: trans.amount,
        method: 'PAYME',
        status: 'CONFIRMED',
        receiptNumber,
        month: currentMonth,
        paidAt: now,
        comment: `Avtomatlashtirilgan Payme to'lovi (Trans ID: ${paymeTransId})`,
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
        result: {
          transaction: trans.id,
          perform_time: trans.performTime.getTime(),
          state: 2,
        },
        id,
      };
    }

    if (trans.state === 2) {
      return {
        result: {
          transaction: trans.id,
          perform_time: trans.performTime ? trans.performTime.getTime() : Date.now(),
          state: 2,
        },
        id,
      };
    }

    return {
      error: {
        code: -31008,
        message: {
          uz: 'Tranzaksiya holati yaroqsiz',
          ru: 'Недопустимый статус транзакции',
          en: 'Invalid transaction status',
        },
      },
      id,
    };
  }

  private async cancelTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const paymeTransId = String(params?.id ?? '');
    const reason = Number(params?.reason);

    const trans = await this.transRepo.findOne({
      where: { provider: 'PAYME', providerTransId: paymeTransId },
    });

    if (!trans) {
      return {
        error: {
          code: -31007,
          message: {
            uz: 'Tranzaksiya topilmadi',
            ru: 'Транзакция не найдена',
            en: 'Transaction not found',
          },
        },
        id,
      };
    }

    const now = new Date();

    if (trans.state === 1) {
      trans.state = -1;
      trans.status = 'CANCELLED';
      trans.cancelTime = now;
      trans.reason = reason;
      await this.transRepo.save(trans);

      return {
        result: {
          transaction: trans.id,
          cancel_time: now.getTime(),
          state: -1,
        },
        id,
      };
    }

    if (trans.state === 2) {
      trans.state = -2;
      trans.status = 'CANCELLED';
      trans.cancelTime = now;
      trans.reason = reason;

      if (trans.paymentRecordId) {
        await this.paymentRepo.update({ id: trans.paymentRecordId }, { status: 'REFUNDED' });
      }

      await this.transRepo.save(trans);

      return {
        result: {
          transaction: trans.id,
          cancel_time: now.getTime(),
          state: -2,
        },
        id,
      };
    }

    return {
      result: {
        transaction: trans.id,
        cancel_time: trans.cancelTime ? trans.cancelTime.getTime() : now.getTime(),
        state: trans.state,
      },
      id,
    };
  }

  private async checkTransaction(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const paymeTransId = String(params?.id ?? '');

    const trans = await this.transRepo.findOne({
      where: { provider: 'PAYME', providerTransId: paymeTransId },
    });

    if (!trans) {
      return {
        error: {
          code: -31007,
          message: {
            uz: 'Tranzaksiya topilmadi',
            ru: 'Транзакция не найдена',
            en: 'Transaction not found',
          },
        },
        id,
      };
    }

    return {
      result: {
        create_time: Number(trans.meta?.time || trans.createdAt.getTime()),
        perform_time: trans.performTime ? trans.performTime.getTime() : 0,
        cancel_time: trans.cancelTime ? trans.cancelTime.getTime() : 0,
        transaction: trans.id,
        state: trans.state,
        reason: trans.reason ?? null,
      },
      id,
    };
  }

  private async getStatement(
    params: Record<string, unknown>,
    id: number | string,
  ): Promise<PaymeRpcResponse> {
    const fromTime = Number(params?.from);
    const toTime = Number(params?.to);

    const fromDate = new Date(fromTime);
    const toDate = new Date(toTime);

    const list = await this.transRepo.find({
      where: {
        provider: 'PAYME',
        createdAt: Between(fromDate, toDate),
      },
      order: { createdAt: 'ASC' },
    });

    return {
      result: {
        transactions: list.map((t) => ({
          id: t.providerTransId,
          time: Number(t.meta?.time || t.createdAt.getTime()),
          amount: Math.round(Number(t.amount) * 100),
          account: { student_code: t.studentCode },
          create_time: Number(t.meta?.time || t.createdAt.getTime()),
          perform_time: t.performTime ? t.performTime.getTime() : 0,
          cancel_time: t.cancelTime ? t.cancelTime.getTime() : 0,
          transaction: t.id,
          state: t.state,
          reason: t.reason ?? null,
        })),
      },
      id,
    };
  }
}
