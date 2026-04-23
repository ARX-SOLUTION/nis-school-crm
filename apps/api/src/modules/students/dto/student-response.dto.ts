import { ApiProperty } from '@nestjs/swagger';
import { Student, StudentGender, StudentStatus } from '../entities/student.entity';

export class StudentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  studentCode!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty({ nullable: true })
  middleName!: string | null;

  @ApiProperty()
  birthDate!: string;

  @ApiProperty({ enum: StudentGender, nullable: true })
  gender!: StudentGender | null;

  @ApiProperty()
  gradeLevel!: number;

  @ApiProperty({ nullable: true, format: 'uuid' })
  classId!: string | null;

  @ApiProperty({ enum: StudentStatus })
  status!: StudentStatus;

  @ApiProperty({ nullable: true })
  parentFullName!: string | null;

  @ApiProperty({ nullable: true })
  parentPhone!: string | null;

  @ApiProperty({ nullable: true })
  parentTelegram!: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  enrolledAt!: Date;

  @ApiProperty({ type: 'string', format: 'date-time', nullable: true })
  leftAt!: Date | null;

  @ApiProperty({ nullable: true })
  leftReason!: string | null;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  static fromEntity(entity: Student): StudentResponseDto {
    const dto = new StudentResponseDto();
    dto.id = entity.id;
    dto.studentCode = entity.studentCode;
    dto.firstName = entity.firstName;
    dto.lastName = entity.lastName;
    dto.middleName = entity.middleName;
    dto.birthDate = entity.birthDate;
    dto.gender = entity.gender;
    dto.gradeLevel = entity.gradeLevel;
    dto.classId = entity.classId;
    dto.status = entity.status;
    dto.parentFullName = entity.parentFullName;
    dto.parentPhone = entity.parentPhone;
    dto.parentTelegram = entity.parentTelegram;
    dto.enrolledAt = entity.enrolledAt;
    dto.leftAt = entity.leftAt;
    dto.leftReason = entity.leftReason;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}
