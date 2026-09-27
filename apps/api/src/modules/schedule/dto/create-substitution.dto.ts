import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubstitutionDto {
  @ApiProperty({ format: 'uuid', description: 'Original Schedule Entry UUID' })
  @IsUUID('4')
  originalEntryId!: string;

  @ApiProperty({ format: 'uuid', description: 'Substitute Teacher User UUID' })
  @IsUUID('4')
  substituteTeacherId!: string;

  @ApiProperty({ description: 'Date of substitution (YYYY-MM-DD)', example: '2026-10-15' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Reason for substitution', example: 'Teacher medical leave' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
