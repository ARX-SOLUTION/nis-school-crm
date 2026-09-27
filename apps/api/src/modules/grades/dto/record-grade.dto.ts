import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { GRADE_TYPES, type GradeType } from '@nis/shared';

export class RecordGradeDto {
  @ApiProperty({ format: 'uuid', description: 'Student UUID' })
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ format: 'uuid', description: 'Class UUID' })
  @IsUUID('4')
  classId!: string;

  @ApiProperty({ format: 'uuid', description: 'Subject UUID' })
  @IsUUID('4')
  subjectId!: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2026-09-28' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ description: 'Score earned', example: 5 })
  @IsNumber()
  @Min(0)
  score!: number;

  @ApiPropertyOptional({ description: 'Maximum score possible', example: 5, default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiPropertyOptional({ enum: GRADE_TYPES, description: 'Type of grade', default: 'CLASSWORK' })
  @IsOptional()
  @IsIn(GRADE_TYPES as unknown as string[])
  gradeType?: GradeType;

  @ApiPropertyOptional({ description: 'Optional feedback / comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}
