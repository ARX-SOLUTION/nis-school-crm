import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { LEAD_STAGES, type LeadStage } from '@nis/shared';

export class UpdateLeadStageDto {
  @ApiProperty({ enum: LEAD_STAGES, description: 'Yangi bosqich' })
  @IsIn(LEAD_STAGES)
  stage!: LeadStage;

  @ApiPropertyOptional({ description: "Bosqich o'zgarishi sababi yoki izoh" })
  @IsOptional()
  @IsString()
  notes?: string;
}
