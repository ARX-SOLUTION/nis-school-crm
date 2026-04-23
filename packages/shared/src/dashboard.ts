export interface StudentCountsDto {
  total: number;
  active: number;
  archived: number;
  unassigned: number;
}

export interface ClassesSummaryDto {
  total: number;
  averageFillPercent: number;
}

export interface DailyCountDto {
  date: string;
  count: number;
}

export interface AdminDashboardStatsDto {
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER';
  students: StudentCountsDto;
  classes: ClassesSummaryDto;
  teachersCount: number;
  newStudentsLast7Days: DailyCountDto[];
}

export interface TeacherMyClassDto {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  studentCount: number;
  maxStudents: number;
}

export interface TeacherDashboardStatsDto {
  role: 'TEACHER';
  myClass: TeacherMyClassDto | null;
}

export type DashboardStatsResponseDto = AdminDashboardStatsDto | TeacherDashboardStatsDto;

export function isAdminStats(stats: DashboardStatsResponseDto): stats is AdminDashboardStatsDto {
  return stats.role !== 'TEACHER';
}
