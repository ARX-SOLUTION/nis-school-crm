import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../../../common/enums/role.enum';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Student } from '../../students/entities/student.entity';
import * as crypto from 'crypto';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { ClickRequest, ClickService } from '../services/click.service';
import { PaymeRpcRequest, PaymeService } from '../services/payme.service';

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

@ApiTags('Payment Gateways (Payme & Click)')
@Controller({ path: 'billing', version: ['1'] })
export class PaymentGatewaysController {
  constructor(
    private readonly paymeService: PaymeService,
    private readonly clickService: ClickService,
    private readonly configService: ConfigService,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(PaymentTransaction)
    private readonly transRepo: Repository<PaymentTransaction>,
  ) {}

  @Public()
  @SkipThrottle()
  @Post('payme')
  @HttpCode(200)
  @ApiOperation({ summary: 'Payme Merchant Webhook (JSON-RPC 2.0)' })
  async payme(@Body() body: PaymeRpcRequest, @Headers('authorization') authHeader?: string) {
    const paymeKey = this.configService.get<string>('PAYME_KEY');
    const base64Part = authHeader ? authHeader.replace(/^Basic\s+/i, '') : '';
    const decoded = authHeader ? Buffer.from(base64Part, 'base64').toString('utf-8') : '';
    const expected = paymeKey ? `Paycom:${paymeKey}` : '';

    if (!authHeader || !paymeKey || !safeCompare(decoded, expected)) {
      return {
        error: {
          code: -32504,
          message: {
            uz: 'Ruxsat berilmagan',
            ru: 'Не авторизован',
            en: 'Unauthorized',
          },
        },
        id: body?.id ?? null,
      };
    }

    return this.paymeService.handleRpc(body);
  }

  // Alias for backward compatibility
  async handlePayme(body: PaymeRpcRequest, authHeader?: string) {
    return this.payme(body, authHeader);
  }

  @Public()
  @SkipThrottle()
  @Post('click')
  @HttpCode(200)
  @ApiOperation({ summary: 'Click Shop Webhook (Prepare / Complete)' })
  async click(@Body() body: ClickRequest) {
    const clickSecret = this.configService.get<string>('CLICK_SECRET_KEY');
    return this.clickService.handleRequest(body, clickSecret);
  }

  // Alias for backward compatibility
  async handleClick(body: ClickRequest) {
    return this.click(body);
  }

  @Public()
  @Get('payment-link')
  @ApiOperation({ summary: "O'quvchi uchun Payme va Click to'lov havolalarini generatsiya qilish" })
  @ApiQuery({ name: 'studentCode', required: true, example: 'STD-001' })
  @ApiQuery({ name: 'amount', required: true, example: 2500000 })
  async getPaymentLink(
    @Query('studentCode') studentCode: string,
    @Query('amount') amountStr: string,
  ) {
    const amount = Number(amountStr);
    const student = await this.studentRepo.findOne({
      where: { studentCode },
      relations: ['class'],
    });

    if (!student) {
      throw new NotFoundException(`Student with code ${studentCode} not found`);
    }

    const paymeMerchantId =
      this.configService.get<string>('PAYME_MERCHANT_ID') || '64a1b2c3d4e5f6a7b8c9d0e1';
    const clickServiceId = this.configService.get<string>('CLICK_SERVICE_ID') || '12345';
    const clickMerchantId = this.configService.get<string>('CLICK_MERCHANT_ID') || '67890';

    // Payme URL: https://checkout.paycom.uz/{base64}
    const paymeParams = `m=${paymeMerchantId};ac.student_code=${studentCode};a=${Math.round(amount * 100)}`;
    const paymeBase64 = Buffer.from(paymeParams).toString('base64');
    const paymeUrl = `https://checkout.paycom.uz/${paymeBase64}`;

    // Click URL: https://my.click.uz/services/pay?service_id=...&merchant_id=...&amount=...&transaction_param=...
    const clickUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${amount}&transaction_param=${studentCode}`;

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: `${student.lastName} ${student.firstName}`,
      amount,
      paymeUrl,
      clickUrl,
    };
  }

  @Get('gateway-transactions')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Gateway tranzaksiyalari ro'yxati (Payme & Click)" })
  async listTransactions(
    @Query('provider') provider?: 'PAYME' | 'CLICK',
    @Query('status') status?: string,
  ) {
    const qb = this.transRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.student', 'student')
      .orderBy('t.createdAt', 'DESC')
      .take(50);

    if (provider) {
      qb.andWhere('t.provider = :provider', { provider });
    }
    if (status) {
      qb.andWhere('t.status = :status', { status });
    }

    const items = await qb.getMany();
    return items.map((t) => ({
      id: t.id,
      provider: t.provider,
      providerTransId: t.providerTransId,
      studentId: t.studentId,
      studentCode: t.studentCode,
      studentName: t.student ? `${t.student.lastName} ${t.student.firstName}` : undefined,
      amount: Number(t.amount),
      state: t.state,
      status: t.status,
      paymentRecordId: t.paymentRecordId,
      performTime: t.performTime,
      cancelTime: t.cancelTime,
      createdAt: t.createdAt,
    }));
  }
}
