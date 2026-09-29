import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DAYS_OF_WEEK, type DayOfWeek } from '@nis/shared';

export class CreateScheduleEntryDto {
  @ApiProperty({ format: 'uuid', description: 'Class UUID' })
  @IsUUID('4')
  classId!: string;

  @ApiProperty({ format: 'uuid', description: 'Subject UUID' })
  @IsUUID('4')
  subjectId!: string;

  @ApiProperty({ format: 'uuid', description: 'Teacher User UUID' })
  @IsUUID('4')
  teacherId!: string;

  @ApiProperty({ format: 'uuid', description: 'Room UUID' })
  @IsUUID('4')
  roomId!: string;

  @ApiProperty({ enum: DAYS_OF_WEEK, description: 'Day of the week' })
  @IsIn(DAYS_OF_WEEK as unknown as string[])
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ description: 'Lesson period number (1-10)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(10)
  lessonNumber!: number;

  @ApiProperty({ description: 'Start time (HH:MM or HH:MM:SS)', example: '08:30:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:MM or HH:MM:SS)', example: '09:15:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
  endTime!: string;

  @ApiProperty({ description: 'Effective start date (YYYY-MM-DD)', example: '2026-09-01' })
  @IsDateString()
  effectiveFrom!: string;

  @ApiPropertyOptional({ description: 'Effective end date (YYYY-MM-DD)', example: '2027-05-25' })
  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @ApiPropertyOptional({ description: 'Active flag', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
