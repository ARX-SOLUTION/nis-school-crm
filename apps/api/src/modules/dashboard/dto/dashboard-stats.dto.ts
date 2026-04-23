import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../../common/enums/role.enum';

export class StudentCountsDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() archived!: number;
  @ApiProperty() unassigned!: number;
}

export class ClassesSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() averageFillPercent!: number;
}

export class DailyCountDto {
  @ApiProperty({ example: '2026-04-23' }) date!: string;
  @ApiProperty() count!: number;
}

export class AdminDashboardStatsDto {
  @ApiProperty({ enum: [RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPER_ADMIN] })
  role!: RoleName.ADMIN | RoleName.MANAGER | RoleName.SUPER_ADMIN;

  @ApiProperty({ type: StudentCountsDto }) students!: StudentCountsDto;
  @ApiProperty({ type: ClassesSummaryDto }) classes!: ClassesSummaryDto;
  @ApiProperty() teachersCount!: number;
  @ApiProperty({ type: [DailyCountDto] }) newStudentsLast7Days!: DailyCountDto[];
}

export class TeacherMyClassDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() gradeLevel!: number;
  @ApiProperty() academicYear!: string;
  @ApiProperty() studentCount!: number;
  @ApiProperty() maxStudents!: number;
}

export class TeacherDashboardStatsDto {
  @ApiProperty({ enum: [RoleName.TEACHER] })
  role!: RoleName.TEACHER;

  @ApiProperty({ type: TeacherMyClassDto, nullable: true })
  myClass!: TeacherMyClassDto | null;
}

export type DashboardStatsDto = AdminDashboardStatsDto | TeacherDashboardStatsDto;
