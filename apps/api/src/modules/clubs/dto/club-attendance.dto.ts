import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { ClubAttendanceStatus } from '@nis/shared';

export class SingleClubAttendanceInputDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;

  @ApiProperty({ enum: ClubAttendanceStatus, example: ClubAttendanceStatus.PRESENT })
  @IsEnum(ClubAttendanceStatus)
  status!: ClubAttendanceStatus;

  @ApiPropertyOptional({ example: 'Musobaqada qatnashmoqda' })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class BulkClubAttendanceDto {
  @ApiProperty({ example: '2026-09-28', description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date!: string;

  @ApiProperty({ type: [SingleClubAttendanceInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleClubAttendanceInputDto)
  records!: SingleClubAttendanceInputDto[];
}

export class EnrollStudentDto {
  @ApiProperty({ description: 'Student UUID to enroll' })
  @IsUUID()
  @IsNotEmpty()
  studentId!: string;
}
