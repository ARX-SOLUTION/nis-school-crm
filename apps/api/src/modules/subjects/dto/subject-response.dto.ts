import { ApiProperty } from '@nestjs/swagger';
import { Subject } from '../entities/subject.entity';

export class SubjectResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Subject UUID' })
  id!: string;

  @ApiProperty({ description: 'Unique subject code', example: 'MATH_7' })
  code!: string;

  @ApiProperty({ description: 'Full subject name', example: 'Mathematics' })
  name!: string;

  @ApiProperty({
    description: 'Grade levels this subject applies to',
    example: [7, 8],
    type: [Number],
  })
  gradeLevels!: number[];

  @ApiProperty({ description: 'Default weekly hours', example: 2 })
  defaultHoursPerWeek!: number;

  @ApiProperty({ description: 'Whether the subject is active' })
  isActive!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: Subject): SubjectResponseDto {
    const dto = new SubjectResponseDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.gradeLevels = entity.gradeLevels;
    dto.defaultHoursPerWeek = entity.defaultHoursPerWeek;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
