import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GradeRecord } from './entities/grade.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([GradeRecord])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService, TypeOrmModule],
})
export class GradesModule {}
