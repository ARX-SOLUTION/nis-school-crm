import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from '../students/entities/student.entity';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PaymentGatewaysController } from './controllers/payment-gateways.controller';
import { PaymentRecord } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { ClickService } from './services/click.service';
import { PaymeService } from './services/payme.service';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecord, PaymentTransaction, Student])],
  controllers: [BillingController, PaymentGatewaysController],
  providers: [BillingService, PaymeService, ClickService],
  exports: [BillingService, PaymeService, ClickService],
})
export class BillingModule {}
