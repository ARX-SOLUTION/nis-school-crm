import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RoleName } from '../../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { BillingService } from './billing.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsQueryDto } from './dto/payments-query.dto';

@ApiTags('Billing & Payments')
@ApiBearerAuth()
@Controller({ path: 'billing', version: ['1'] })
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('payments')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "To'lov qabul qilish (Record payment)" })
  async recordPayment(@Body() dto: CreatePaymentDto) {
    return this.billingService.recordPayment(dto);
  }

  @Get('payments')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "To'lovlar ro'yxati (List payments)" })
  async listPayments(@Query() query: PaymentsQueryDto) {
    return this.billingService.listPayments(query);
  }

  @Get('stats')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: 'Moliya statistikasi (Billing stats)' })
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  async getStats(@Query('month') month?: string) {
    return this.billingService.getStats(month);
  }

  @Get('debtors')
  @Roles(RoleName.ADMIN, RoleName.MANAGER)
  @ApiOperation({ summary: "Qarzdorlar ro'yxati (Debtors list)" })
  @ApiQuery({ name: 'month', required: false, example: '2026-09' })
  async getDebtors(@Query('month') month?: string) {
    return this.billingService.getDebtors(month);
  }
}
