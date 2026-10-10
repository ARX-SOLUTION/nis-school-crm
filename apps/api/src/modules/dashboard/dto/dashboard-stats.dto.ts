import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../../common/enums/role.enum';

export class StudentCountsDto {
  @ApiProperty() total!: number;
  @ApiProperty() active!: number;
  @ApiProperty() archived!: number;
  @ApiProperty() unassigned!: number;
}

export class ClassFillBucketDto {
  @ApiProperty({ enum: ['<50%', '50-79%', '80-99%', '100%'] })
  bucket!: '<50%' | '50-79%' | '80-99%' | '100%';

  @ApiProperty()
  label!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty({ type: [String] })
  classNames!: string[];
}

export class ClassesSummaryDto {
  @ApiProperty() total!: number;
  @ApiProperty() averageFillPercent!: number;
  @ApiProperty({ type: [ClassFillBucketDto] }) distribution!: ClassFillBucketDto[];
}

export class DailyCountDto {
  @ApiProperty({ example: '2026-04-23' }) date!: string;
  @ApiProperty() count!: number;
}

export class AttendanceComplianceDto {
  @ApiProperty() expectedClasses!: number;
  @ApiProperty() markedClasses!: number;
  @ApiProperty() rate!: number;
  @ApiProperty() thirtyDayMeanRate!: number;
  @ApiProperty() unmarkedClassesCount!: number;
}

export class CollectionRateKpiDto {
  @ApiProperty() current!: number;
  @ApiProperty() sameDayLastMonth!: number;
  @ApiProperty() isCritical!: boolean;
}

export class ArrearsKpiDto {
  @ApiProperty() totalArrears!: number;
  @ApiProperty() previousMonthTotalArrears!: number;
  @ApiProperty() debtorCount!: number;
  @ApiProperty() priorMonthGapsCount!: number;
}

export class DashboardAlertDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['critical', 'warning'] }) level!: 'critical' | 'warning';
  @ApiProperty({ enum: ['UNMARKED_CLASSES', 'STUCK_PAYMENTS', 'ARREARS', 'UNLINKED_PARENTS'] })
  type!: 'UNMARKED_CLASSES' | 'STUCK_PAYMENTS' | 'ARREARS' | 'UNLINKED_PARENTS';
  @ApiProperty() title!: string;
  @ApiProperty() count!: number;
  @ApiProperty() reason!: string;
  @ApiProperty() link!: string;
}

export class AdminDashboardStatsDto {
  @ApiProperty({ enum: [RoleName.ADMIN, RoleName.MANAGER, RoleName.SUPER_ADMIN] })
  role!: RoleName.ADMIN | RoleName.MANAGER | RoleName.SUPER_ADMIN;

  @ApiProperty({ type: StudentCountsDto }) students!: StudentCountsDto;
  @ApiProperty({ type: ClassesSummaryDto }) classes!: ClassesSummaryDto;
  @ApiProperty() teachersCount!: number;
  @ApiProperty({ type: [DailyCountDto] }) newStudentsLast7Days!: DailyCountDto[];
  @ApiProperty({ type: AttendanceComplianceDto }) compliance!: AttendanceComplianceDto;
  @ApiProperty({ type: CollectionRateKpiDto }) collectionRateKpi!: CollectionRateKpiDto;
  @ApiProperty({ type: ArrearsKpiDto }) arrearsKpi!: ArrearsKpiDto;
  @ApiProperty({ type: [DashboardAlertDto] }) alerts!: DashboardAlertDto[];
}

export class TeacherMyClassDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() gradeLevel!: number;
  @ApiProperty() academicYear!: string;
  @ApiProperty() studentCount!: number;
  @ApiProperty() maxStudents!: number;
}

export class TeacherClassAttendanceKpiDto {
  @ApiProperty() isMarkedToday!: boolean;
  @ApiProperty() weeklyAttendanceRate!: number;
}

export class TeacherClassArrearsKpiDto {
  @ApiProperty() debtorCount!: number;
  @ApiProperty() totalArrears!: number;
}

export class TeacherDashboardStatsDto {
  @ApiProperty({ enum: [RoleName.TEACHER] })
  role!: RoleName.TEACHER;

  @ApiProperty({ type: TeacherMyClassDto, nullable: true })
  myClass!: TeacherMyClassDto | null;

  @ApiProperty({ type: TeacherClassAttendanceKpiDto, nullable: true })
  attendance!: TeacherClassAttendanceKpiDto | null;

  @ApiProperty({ type: TeacherClassArrearsKpiDto, nullable: true })
  arrears!: TeacherClassArrearsKpiDto | null;
}

export type DashboardStatsDto = AdminDashboardStatsDto | TeacherDashboardStatsDto;
