export interface ClassAttendanceReportDto {
  classId: string;
  className: string;
  gradeLevel: number;
  totalStudents: number;
  totalRecords: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
  month: string;
}

export interface SubjectGradeReportDto {
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  totalRecorded: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passingCount: number;
  passingRate: number;
}

export interface TopStudentDto {
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string | null;
  averageScore: number;
  totalGrades: number;
}

export interface MonthlyRevenueDto {
  month: string;
  totalCollected: number;
  totalExpected: number;
  collectionRate: number;
  paymentCount: number;
}

export interface FinanceReportDto {
  months: MonthlyRevenueDto[];
  totalCollectedPeriod: number;
  averageMonthlyRevenue: number;
}

export interface AttendanceReportQueryDto {
  month?: string;
  classId?: string;
}

export interface GradesReportQueryDto {
  classId?: string;
  subjectId?: string;
}

export interface FinanceReportQueryDto {
  months?: number;
}
