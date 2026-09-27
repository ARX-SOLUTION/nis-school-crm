import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { LEAD_SOURCES, LEAD_STAGES, type LeadSource, type LeadStage } from '@nis/shared';

export class LeadsQueryDto {
  @ApiPropertyOptional({ enum: LEAD_STAGES, description: "Bosqich bo'yicha filtrlash" })
  @IsOptional()
  @IsIn(LEAD_STAGES)
  stage?: LeadStage;

  @ApiPropertyOptional({ enum: LEAD_SOURCES, description: "Manba bo'yicha filtrlash" })
  @IsOptional()
  @IsIn(LEAD_SOURCES)
  source?: LeadSource;

  @ApiPropertyOptional({ description: "Ism yoki telefon bo'yicha qidirish" })
  @IsOptional()
  @IsString()
  search?: string;
}
