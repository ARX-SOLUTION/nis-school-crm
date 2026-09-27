import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ATTENDANCE_STATUSES, type AttendanceStatus } from '@nis/shared';

export class BulkAttendanceItemDto {
  @ApiProperty({ format: 'uuid', description: 'Student UUID' })
  @IsUUID('4')
  studentId!: string;

  @ApiProperty({ enum: ATTENDANCE_STATUSES, description: 'Attendance Status' })
  @IsIn(ATTENDANCE_STATUSES as unknown as string[])
  status!: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Optional note / reason' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class BulkAttendanceRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Class UUID' })
  @IsUUID('4')
  classId!: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2026-09-28' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ type: [BulkAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  records!: BulkAttendanceItemDto[];
}
