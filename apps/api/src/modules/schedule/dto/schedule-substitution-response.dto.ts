import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SubstitutionStatus } from '@nis/shared';
import { ScheduleSubstitution } from '../entities/schedule-substitution.entity';

export class ScheduleSubstitutionResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Substitution UUID' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Original Schedule Entry UUID' })
  originalEntryId!: string;

  @ApiProperty({ format: 'uuid', description: 'Substitute Teacher UUID' })
  substituteTeacherId!: string;

  @ApiProperty({ description: 'Date of substitution', example: '2026-10-15' })
  date!: string;

  @ApiPropertyOptional({ description: 'Reason for substitution' })
  reason!: string | null;

  @ApiProperty({ description: 'Status of substitution', enum: ['CONFIRMED', 'CANCELLED'] })
  status!: SubstitutionStatus;

  @ApiPropertyOptional({ format: 'uuid', description: 'Creator User UUID' })
  createdBy!: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: ScheduleSubstitution): ScheduleSubstitutionResponseDto {
    const dto = new ScheduleSubstitutionResponseDto();
    dto.id = entity.id;
    dto.originalEntryId = entity.originalEntryId;
    dto.substituteTeacherId = entity.substituteTeacherId;
    dto.date = entity.date;
    dto.reason = entity.reason;
    dto.status = entity.status;
    dto.createdBy = entity.createdById;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
