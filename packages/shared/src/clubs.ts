export enum ClubCategory {
  STEM_ROBOTICS = 'STEM_ROBOTICS',
  SPORTS = 'SPORTS',
  ARTS_CRAFT = 'ARTS_CRAFT',
  MUSIC_PERFORMING = 'MUSIC_PERFORMING',
  LANGUAGES = 'LANGUAGES',
  ACADEMIC_OLYMPIAD = 'ACADEMIC_OLYMPIAD',
}

export enum ClubFeeType {
  FREE = 'FREE',
  PAID = 'PAID',
}

export enum ClubStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  DROPPED = 'DROPPED',
}

export enum ClubAttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
}

export interface ClubScheduleDto {
  id?: string;
  clubId?: string;
  dayOfWeek: number; // 1 = Dushanba, ..., 6 = Shanba
  startTime: string; // HH:MM format (masalan "15:30")
  endTime: string; // HH:MM format (masalan "17:00")
  roomId?: string | null;
  roomNumber?: string | null;
}

export interface ClubEnrollmentDto {
  id: string;
  clubId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  gradeLevel: number;
  className?: string | null;
  parentPhone?: string | null;
  enrolledAt: string;
  status: EnrollmentStatus;
  droppedAt?: string | null;
  dropReason?: string | null;
}

export interface ClubAttendanceRecordDto {
  id: string;
  clubId: string;
  studentId: string;
  studentName?: string;
  date: string; // YYYY-MM-DD
  status: ClubAttendanceStatus;
  remarks?: string | null;
  recordedById?: string | null;
  recordedByName?: string | null;
}

export interface ClubDto {
  id: string;
  name: string;
  category: ClubCategory;
  description?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  instructorId?: string | null;
  instructorName?: string | null;
  instructorPhone?: string | null;
  roomId?: string | null;
  roomNumber?: string | null;
  capacity: number;
  enrolledCount: number;
  minGrade: number;
  maxGrade: number;
  feeType: ClubFeeType;
  monthlyFee: number;
  status: ClubStatus;
  schedules?: ClubScheduleDto[];
  enrollments?: ClubEnrollmentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateClubPayload {
  name: string;
  category: ClubCategory;
  description?: string;
  branchId?: string;
  instructorId?: string;
  instructorName?: string;
  instructorPhone?: string;
  roomId?: string;
  capacity: number;
  minGrade?: number;
  maxGrade?: number;
  feeType?: ClubFeeType;
  monthlyFee?: number;
  schedules?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomId?: string;
  }>;
}

export interface UpdateClubPayload {
  name?: string;
  category?: ClubCategory;
  description?: string;
  branchId?: string;
  instructorId?: string;
  instructorName?: string;
  instructorPhone?: string;
  roomId?: string;
  capacity?: number;
  minGrade?: number;
  maxGrade?: number;
  feeType?: ClubFeeType;
  monthlyFee?: number;
  status?: ClubStatus;
  schedules?: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomId?: string;
  }>;
}

export interface EnrollStudentPayload {
  studentId: string;
}

export interface RecordClubAttendancePayload {
  date: string; // YYYY-MM-DD
  records: Array<{
    studentId: string;
    status: ClubAttendanceStatus;
    remarks?: string;
  }>;
}

export interface ClubStatsDto {
  totalClubs: number;
  activeClubs: number;
  totalEnrolled: number;
  todaySessionsCount: number;
  averageAttendanceRate: number; // 0 - 100
}
