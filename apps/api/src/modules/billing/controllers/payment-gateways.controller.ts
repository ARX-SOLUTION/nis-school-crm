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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../../../common/enums/role.enum';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Student } from '../../students/entities/student.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { ClickRequest, ClickService } from '../services/click.service';
import { PaymeRpcRequest, PaymeService } from '../services/payme.service';

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
  @Post('payme')
  @HttpCode(200)
  @ApiOperation({ summary: 'Payme Merchant Webhook (JSON-RPC 2.0)' })
  async handlePayme(@Body() body: PaymeRpcRequest, @Headers('authorization') authHeader?: string) {
    const paymeKey = this.configService.get<string>('PAYME_KEY');
    if (paymeKey && authHeader) {
      const base64Part = authHeader.replace(/^Basic\s+/i, '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      const expected = `Paycom:${paymeKey}`;
      if (decoded !== expected) {
        return {
          error: {
            code: -32504,
            message: {
              uz: 'Ruxsat berilmagan',
              ru: 'Недостаточно привилегий',
              en: 'Insufficient privilege',
            },
          },
          id: body?.id ?? null,
        };
      }
    }

    return this.paymeService.handleRpc(body);
  }

  @Public()
  @Post('click')
  @HttpCode(200)
  @ApiOperation({ summary: 'Click Shop Webhook (Prepare / Complete)' })
  async handleClick(@Body() body: ClickRequest) {
    const clickSecret = this.configService.get<string>('CLICK_SECRET_KEY');
    return this.clickService.handleRequest(body, clickSecret);
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
