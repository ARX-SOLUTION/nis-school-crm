import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClassDto {
  @ApiProperty({ example: '4-A' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  name!: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 11 })
  @IsInt()
  @Min(1)
  @Max(11)
  gradeLevel!: number;

  @ApiProperty({ example: '2026-2027', description: 'Academic year in YYYY-YYYY form' })
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'academicYear must match YYYY-YYYY' })
  academicYear!: string;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 60 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  maxStudents?: number;

  @ApiPropertyOptional({ example: '201' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Optional class teacher (must be TEACHER role)' })
  @IsOptional()
  @IsUUID()
  classTeacherId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
