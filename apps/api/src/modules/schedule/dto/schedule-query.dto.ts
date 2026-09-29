import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';
import { DAYS_OF_WEEK, type DayOfWeek } from '@nis/shared';

export class ScheduleQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Class ID' })
  @IsOptional()
  @IsUUID('4')
  classId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Teacher ID' })
  @IsOptional()
  @IsUUID('4')
  teacherId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Room ID' })
  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @ApiPropertyOptional({ enum: DAYS_OF_WEEK, description: 'Filter by day of week' })
  @IsOptional()
  @IsIn(DAYS_OF_WEEK as unknown as string[])
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
