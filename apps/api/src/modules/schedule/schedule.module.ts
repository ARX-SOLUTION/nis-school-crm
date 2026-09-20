import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntry } from './entities/schedule-entry.entity';
import { ScheduleSubstitution } from './entities/schedule-substitution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEntry, ScheduleSubstitution])],
  exports: [TypeOrmModule],
})
export class ScheduleModule {}
