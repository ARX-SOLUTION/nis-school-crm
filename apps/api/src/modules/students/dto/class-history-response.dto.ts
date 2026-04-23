import { ApiProperty } from '@nestjs/swagger';
import { StudentClassHistory } from '../entities/student-class-history.entity';

export class ClassHistoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiProperty({ format: 'uuid' })
  classId!: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  assignedAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  removedAt!: Date | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  assignedById!: string | null;

  @ApiProperty({ nullable: true })
  reason!: string | null;

  static fromEntity(entity: StudentClassHistory): ClassHistoryResponseDto {
    const dto = new ClassHistoryResponseDto();
    dto.id = entity.id;
    dto.studentId = entity.studentId;
    dto.classId = entity.classId;
    dto.assignedAt = entity.assignedAt;
    dto.removedAt = entity.removedAt;
    dto.assignedById = entity.assignedById;
    dto.reason = entity.reason;
    return dto;
  }
}
