import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student } from './entities/student.entity';
import { StudentClassHistory } from './entities/student-class-history.entity';
import { StudentCodeService } from './services/student-code.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [TypeOrmModule.forFeature([Student, StudentClassHistory, ClassEntity])],
  controllers: [StudentsController],
  providers: [StudentsService, StudentCodeService],
  exports: [StudentsService],
})
export class StudentsModule {}
