export const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceRecordDto {
  id: string;
  studentId: string;
  studentName?: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  recordedById?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface BulkAttendanceItemDto {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface BulkAttendanceRequestDto {
  classId: string;
  date: string;
  records: BulkAttendanceItemDto[];
}

export interface AttendanceStatsDto {
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  ratePercentage: number;
}
