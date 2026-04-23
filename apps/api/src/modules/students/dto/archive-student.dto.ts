import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ArchiveStudentDto {
  @ApiProperty({ description: 'Reason the student is being archived' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}
