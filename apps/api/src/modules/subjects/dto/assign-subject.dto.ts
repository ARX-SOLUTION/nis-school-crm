import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { ACADEMIC_YEAR_PATTERN } from '@nis/shared';

export class AssignSubjectDto {
  @ApiProperty({ description: 'Subject UUID to assign to the class', format: 'uuid' })
  @IsUUID('4')
  subjectId!: string;

  @ApiProperty({ description: 'Teacher UUID (must have TEACHER role)', format: 'uuid' })
  @IsUUID('4')
  teacherId!: string;

  @ApiPropertyOptional({
    description:
      'Weekly hours override for this class+subject; defaults to subject.defaultHoursPerWeek',
    example: 3,
    minimum: 1,
    maximum: 40,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(40)
  hoursPerWeek?: number;

  @ApiProperty({
    description: 'Academic year in YYYY-YYYY format',
    example: '2025-2026',
  })
  @IsString()
  @Matches(ACADEMIC_YEAR_PATTERN, { message: 'academicYear must match YYYY-YYYY' })
  academicYear!: string;
}
