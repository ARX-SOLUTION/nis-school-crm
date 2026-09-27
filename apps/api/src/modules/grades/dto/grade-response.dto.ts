import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GradeType } from '@nis/shared';
import { GradeRecord } from '../entities/grade.entity';

export class GradeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiPropertyOptional()
  studentName?: string;

  @ApiProperty({ format: 'uuid' })
  classId!: string;

  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  @ApiPropertyOptional()
  subjectName?: string;

  @ApiProperty({ example: '2026-09-28' })
  date!: string;

  @ApiProperty({ example: 5 })
  score!: number;

  @ApiProperty({ example: 5 })
  maxScore!: number;

  @ApiProperty({ enum: ['CLASSWORK', 'HOMEWORK', 'EXAM', 'QUARTER'] })
  gradeType!: GradeType;

  @ApiPropertyOptional()
  comment?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  teacherId?: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: GradeRecord): GradeResponseDto {
    const dto = new GradeResponseDto();
    dto.id = entity.id;
    dto.studentId = entity.studentId;
    if (entity.student) {
      dto.studentName = `${entity.student.firstName} ${entity.student.lastName}`.trim();
    }
    dto.classId = entity.classId;
    dto.subjectId = entity.subjectId;
    if (entity.subject) {
      dto.subjectName = entity.subject.name;
    }
    dto.date = entity.date;
    dto.score = Number(entity.score);
    dto.maxScore = Number(entity.maxScore);
    dto.gradeType = entity.gradeType;
    dto.comment = entity.comment;
    dto.teacherId = entity.teacherId;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
