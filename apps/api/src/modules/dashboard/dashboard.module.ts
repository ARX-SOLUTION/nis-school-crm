import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { PaymentTransaction } from '../billing/entities/payment-transaction.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { ParentStudent } from '../parents/entities/parent-student.entity';
import { Student } from '../students/entities/student.entity';
import { User } from '../users/entities/user.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      ClassEntity,
      User,
      AttendanceRecord,
      PaymentRecord,
      PaymentTransaction,
      ParentStudent,
    ]),
    AuditModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
