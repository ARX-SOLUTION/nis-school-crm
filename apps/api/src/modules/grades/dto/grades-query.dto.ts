import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GradesQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Class UUID' })
  @IsOptional()
  @IsUUID('4')
  classId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Student UUID' })
  @IsOptional()
  @IsUUID('4')
  studentId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by Subject UUID' })
  @IsOptional()
  @IsUUID('4')
  subjectId?: string;

  @ApiPropertyOptional({ description: 'Filter by date YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Start date YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date YYYY-MM-DD' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
