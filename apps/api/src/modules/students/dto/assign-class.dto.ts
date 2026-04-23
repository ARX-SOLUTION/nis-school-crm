import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AssignClassDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  classId!: string;

  @ApiPropertyOptional({ description: 'Free-text reason stored in history' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
