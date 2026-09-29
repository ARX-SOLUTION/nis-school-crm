import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ClubCategory, ClubFeeType, ClubStatus } from '@nis/shared';

export class ClubQueryDto {
  @ApiPropertyOptional({ enum: ClubCategory })
  @IsEnum(ClubCategory)
  @IsOptional()
  category?: ClubCategory;

  @ApiPropertyOptional({ enum: ClubStatus })
  @IsEnum(ClubStatus)
  @IsOptional()
  status?: ClubStatus;

  @ApiPropertyOptional({ enum: ClubFeeType })
  @IsEnum(ClubFeeType)
  @IsOptional()
  feeType?: ClubFeeType;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
