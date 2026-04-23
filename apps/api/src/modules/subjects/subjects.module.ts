import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassEntity } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { ClassSubjectsController } from './class-subjects.controller';
import { ClassSubjectsService } from './class-subjects.service';
import { ClassSubject } from './entities/class-subject.entity';
import { Subject } from './entities/subject.entity';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subject, ClassSubject, ClassEntity, User])],
  controllers: [SubjectsController, ClassSubjectsController],
  providers: [SubjectsService, ClassSubjectsService],
  exports: [SubjectsService, ClassSubjectsService],
})
export class SubjectsModule {}
