import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { ScheduleSubstitution } from './entities/schedule-substitution.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntry, ScheduleSubstitution])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService, TypeOrmModule],
})
export class ScheduleModule {}
