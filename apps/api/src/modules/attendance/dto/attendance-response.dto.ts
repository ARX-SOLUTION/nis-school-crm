import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AttendanceStatus } from '@nis/shared';
import { AttendanceRecord } from '../entities/attendance.entity';

export class AttendanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  studentId!: string;

  @ApiPropertyOptional()
  studentName?: string;

  @ApiProperty({ format: 'uuid' })
  classId!: string;

  @ApiProperty({ example: '2026-09-28' })
  date!: string;

  @ApiProperty({ enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] })
  status!: AttendanceStatus;

  @ApiPropertyOptional()
  remarks?: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  recordedById?: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time' })
  updatedAt!: Date;

  static fromEntity(entity: AttendanceRecord): AttendanceResponseDto {
    const dto = new AttendanceResponseDto();
    dto.id = entity.id;
    dto.studentId = entity.studentId;
    if (entity.student) {
      dto.studentName = `${entity.student.firstName} ${entity.student.lastName}`.trim();
    }
    dto.classId = entity.classId;
    dto.date = entity.date;
    dto.status = entity.status;
    dto.remarks = entity.remarks;
    dto.recordedById = entity.recordedById;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
