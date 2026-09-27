import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class ConvertToStudentDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Biriktiriladigan sinf UUID' })
  @IsOptional()
  @IsUUID('4')
  classId?: string;

  @ApiPropertyOptional({ description: "Tug'ilgan sana (YYYY-MM-DD)", example: '2015-05-15' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE'], description: 'Jinsi' })
  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';
}
