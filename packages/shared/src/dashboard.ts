export interface StudentCountsDto {
  total: number;
  active: number;
  archived: number;
  unassigned: number;
}

export interface ClassFillBucketDto {
  bucket: '<50%' | '50-79%' | '80-99%' | '100%';
  label: string;
  count: number;
  classNames: string[];
}

export interface ClassesSummaryDto {
  total: number;
  averageFillPercent: number;
  distribution: ClassFillBucketDto[];
}

export interface DailyCountDto {
  date: string;
  count: number;
}

export interface AttendanceComplianceDto {
  expectedClasses: number;
  markedClasses: number;
  rate: number;
  thirtyDayMeanRate: number;
  unmarkedClassesCount: number;
}

export interface CollectionRateKpiDto {
  current: number;
  sameDayLastMonth: number;
  isCritical: boolean;
}

export interface ArrearsKpiDto {
  totalArrears: number;
  previousMonthTotalArrears: number;
  debtorCount: number;
  priorMonthGapsCount: number;
}

export interface DashboardAlertDto {
  id: string;
  level: 'critical' | 'warning';
  type: 'UNMARKED_CLASSES' | 'STUCK_PAYMENTS' | 'ARREARS' | 'UNLINKED_PARENTS';
  title: string;
  count: number;
  reason: string;
  link: string;
}

export interface AdminDashboardStatsDto {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
  students: StudentCountsDto;
  classes: ClassesSummaryDto;
  teachersCount: number;
  newStudentsLast7Days: DailyCountDto[];
  compliance: AttendanceComplianceDto;
  collectionRateKpi: CollectionRateKpiDto;
  arrearsKpi: ArrearsKpiDto;
  alerts: DashboardAlertDto[];
}

export interface TeacherMyClassDto {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  studentCount: number;
  maxStudents: number;
}

export interface TeacherClassAttendanceKpiDto {
  isMarkedToday: boolean;
  weeklyAttendanceRate: number;
}

export interface TeacherClassArrearsKpiDto {
  debtorCount: number;
  totalArrears: number;
}

export interface TeacherDashboardStatsDto {
  role: 'TEACHER';
  myClass: TeacherMyClassDto | null;
  attendance: TeacherClassAttendanceKpiDto | null;
  arrears: TeacherClassArrearsKpiDto | null;
}

export type DashboardStatsResponseDto = AdminDashboardStatsDto | TeacherDashboardStatsDto;

export function isAdminStats(stats: DashboardStatsResponseDto): stats is AdminDashboardStatsDto {
  return stats.role !== 'TEACHER';
}
