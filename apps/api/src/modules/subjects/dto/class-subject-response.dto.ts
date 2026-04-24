import { ApiProperty } from '@nestjs/swagger';
import { ClassSubject } from '../entities/class-subject.entity';
import { SubjectResponseDto } from './subject-response.dto';

export class TeacherSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Ali Valiyev' })
  fullName!: string;

  @ApiProperty({ example: 'ali.valiyev@nis.edu.uz' })
  email!: string;
}

export class ClassSubjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Class UUID' })
  classId!: string;

  @ApiProperty({ format: 'uuid', description: 'Subject UUID' })
  subjectId!: string;

  @ApiProperty({ type: () => SubjectResponseDto })
  subject!: SubjectResponseDto;

  @ApiProperty({ format: 'uuid', description: 'Teacher user UUID' })
  teacherId!: string;

  @ApiProperty({ type: () => TeacherSummaryDto })
  teacher!: TeacherSummaryDto;

  @ApiProperty({ description: 'Weekly hours for this class+subject assignment', example: 3 })
  hoursPerWeek!: number;

  @ApiProperty({ description: 'Academic year', example: '2025-2026' })
  academicYear!: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: ClassSubject): ClassSubjectResponseDto {
    const dto = new ClassSubjectResponseDto();
    dto.id = entity.id;
    dto.classId = entity.classId;
    dto.subjectId = entity.subjectId;
    dto.subject = SubjectResponseDto.fromEntity(entity.subject);
    dto.teacherId = entity.teacherId;
    const teacher = new TeacherSummaryDto();
    teacher.id = entity.teacher.id;
    teacher.fullName = entity.teacher.fullName;
    teacher.email = entity.teacher.email;
    dto.teacher = teacher;
    dto.hoursPerWeek = entity.hoursPerWeek;
    dto.academicYear = entity.academicYear;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
