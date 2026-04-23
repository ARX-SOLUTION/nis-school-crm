import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignTeacherDto {
  @ApiProperty({ format: 'uuid', description: 'Target teacher user id' })
  @IsUUID()
  teacherId!: string;
}
