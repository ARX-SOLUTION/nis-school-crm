import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { LEAD_SOURCES, type LeadSource } from '@nis/shared';

export class CreateLeadDto {
  @ApiProperty({ description: "O'quvchi yoki nomzodning to'liq ismi", example: 'Aliyev Valijon' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'Telefon raqam', example: '+998901234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ description: 'Ota-ona ismi', example: 'Aliyev Olim' })
  @IsOptional()
  @IsString()
  parentName?: string;

  @ApiPropertyOptional({ description: "Mo'ljallangan sinf", example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(11)
  targetGradeLevel?: number;

  @ApiPropertyOptional({ enum: LEAD_SOURCES, default: 'TELEGRAM' })
  @IsOptional()
  @IsIn(LEAD_SOURCES)
  source?: LeadSource = 'TELEGRAM';

  @ApiPropertyOptional({ description: "Qo'shimcha izohlar" })
  @IsOptional()
  @IsString()
  notes?: string;
}
