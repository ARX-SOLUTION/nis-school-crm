import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DayOfWeek } from '@nis/shared';
import { ScheduleEntry } from '../entities/schedule-entry.entity';

export class ScheduleEntryResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Schedule Entry UUID' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Class UUID' })
  classId!: string;

  @ApiProperty({ format: 'uuid', description: 'Subject UUID' })
  subjectId!: string;

  @ApiProperty({ format: 'uuid', description: 'Teacher UUID' })
  teacherId!: string;

  @ApiProperty({ format: 'uuid', description: 'Room UUID' })
  roomId!: string;

  @ApiProperty({
    description: 'Day of week',
    enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
  })
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ description: 'Lesson period number (1 to 10)', example: 1 })
  lessonNumber!: number;

  @ApiProperty({ description: 'Start time (HH:MM:SS)', example: '08:30:00' })
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:MM:SS)', example: '09:15:00' })
  endTime!: string;

  @ApiProperty({ description: 'Effective from date', example: '2026-09-01' })
  effectiveFrom!: string;

  @ApiPropertyOptional({ description: 'Effective to date', example: '2027-05-25' })
  effectiveTo!: string | null;

  @ApiProperty({ description: 'Active status' })
  isActive!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: ScheduleEntry): ScheduleEntryResponseDto {
    const dto = new ScheduleEntryResponseDto();
    dto.id = entity.id;
    dto.classId = entity.classId;
    dto.subjectId = entity.subjectId;
    dto.teacherId = entity.teacherId;
    dto.roomId = entity.roomId;
    dto.dayOfWeek = entity.dayOfWeek;
    dto.lessonNumber = entity.lessonNumber;
    dto.startTime = entity.startTime;
    dto.endTime = entity.endTime;
    dto.effectiveFrom = entity.effectiveFrom;
    dto.effectiveTo = entity.effectiveTo;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
