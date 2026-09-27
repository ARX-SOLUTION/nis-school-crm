import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceRecord } from '../attendance/entities/attendance.entity';
import { PaymentRecord } from '../billing/entities/payment.entity';
import { ClassEntity } from '../classes/entities/class.entity';
import { GradeRecord } from '../grades/entities/grade.entity';
import { Student } from '../students/entities/student.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceRecord,
      ClassEntity,
      GradeRecord,
      PaymentRecord,
      Student,
      Subject,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
