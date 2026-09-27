import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ClubCategory, ClubFeeType } from '@nis/shared';

export class ClubScheduleInputDto {
  @ApiProperty({ description: 'Day of week (1 = Monday ... 6 = Saturday)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Start time in HH:MM format', example: '15:30' })
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:MM format', example: '17:00' })
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @ApiPropertyOptional({ description: 'Optional room override' })
  @IsUUID()
  @IsOptional()
  roomId?: string;
}

export class CreateClubDto {
  @ApiProperty({ example: 'STEM & Robototexnika' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: ClubCategory, example: ClubCategory.STEM_ROBOTICS })
  @IsEnum(ClubCategory)
  category!: ClubCategory;

  @ApiPropertyOptional({ example: "Robototexnika va modellashtirish to'garagi" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  instructorId?: string;

  @ApiPropertyOptional({ example: 'Sardor Rahimov' })
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiPropertyOptional({ example: '+998 90 123 45 67' })
  @IsString()
  @IsOptional()
  instructorPhone?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiProperty({ example: 15, default: 15 })
  @IsInt()
  @Min(1)
  @Max(200)
  capacity!: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @Max(11)
  @IsOptional()
  minGrade?: number;

  @ApiPropertyOptional({ example: 11, default: 11 })
  @IsInt()
  @Min(1)
  @Max(11)
  @IsOptional()
  maxGrade?: number;

  @ApiPropertyOptional({ enum: ClubFeeType, default: ClubFeeType.FREE })
  @IsEnum(ClubFeeType)
  @IsOptional()
  feeType?: ClubFeeType;

  @ApiPropertyOptional({ example: 350000, default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyFee?: number;

  @ApiPropertyOptional({ type: [ClubScheduleInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClubScheduleInputDto)
  @IsOptional()
  schedules?: ClubScheduleInputDto[];
}
