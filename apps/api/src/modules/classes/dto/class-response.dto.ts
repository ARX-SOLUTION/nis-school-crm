import { ApiProperty } from '@nestjs/swagger';
import { ClassEntity } from '../entities/class.entity';

export class ClassResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  gradeLevel!: number;

  @ApiProperty()
  academicYear!: string;

  @ApiProperty()
  maxStudents!: number;

  @ApiProperty({ nullable: true })
  roomNumber!: string | null;

  @ApiProperty({ nullable: true, format: 'uuid' })
  classTeacherId!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  static fromEntity(entity: ClassEntity): ClassResponseDto {
    const dto = new ClassResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.gradeLevel = entity.gradeLevel;
    dto.academicYear = entity.academicYear;
    dto.maxStudents = entity.maxStudents;
    dto.roomNumber = entity.roomNumber;
    dto.classTeacherId = entity.classTeacherId;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
