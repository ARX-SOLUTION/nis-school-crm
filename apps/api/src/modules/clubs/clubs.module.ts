import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Club } from './entities/club.entity';
import { ClubSchedule } from './entities/club-schedule.entity';
import { ClubEnrollment } from './entities/club-enrollment.entity';
import { ClubAttendance } from './entities/club-attendance.entity';
import { Student } from '../students/entities/student.entity';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Club, ClubSchedule, ClubEnrollment, ClubAttendance, Student]),
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService],
})
export class ClubsModule {}
