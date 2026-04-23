export const ROOM_TYPES = ['CLASSROOM', 'LAB', 'SPORTS', 'AUDITORIUM', 'OTHER'] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

// Academic year format: "2025-2026". Used by class_subjects + grades (Week 4).
export const ACADEMIC_YEAR_PATTERN = /^[0-9]{4}-[0-9]{4}$/;

// ── Wire-shape interfaces (pure TypeScript — no runtime code) ─────────────────

export interface SubjectResponseDto {
  id: string;
  code: string;
  name: string;
  gradeLevels: number[];
  defaultHoursPerWeek: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectRequestDto {
  code: string;
  name: string;
  gradeLevels: number[];
  defaultHoursPerWeek?: number;
  isActive?: boolean;
}

export interface UpdateSubjectRequestDto {
  name?: string;
  gradeLevels?: number[];
  defaultHoursPerWeek?: number;
  isActive?: boolean;
}

export interface AssignSubjectRequestDto {
  subjectId: string;
  teacherId: string;
  hoursPerWeek?: number;
  academicYear: string;
}

export interface UpdateClassSubjectRequestDto {
  teacherId?: string;
  hoursPerWeek?: number;
  academicYear?: string;
}

export interface TeacherSummaryDto {
  id: string;
  fullName: string;
  email: string;
}

export interface ClassSubjectResponseDto {
  id: string;
  classId: string;
  subjectId: string;
  subject: SubjectResponseDto;
  teacherId: string;
  teacher: TeacherSummaryDto;
  hoursPerWeek: number;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomConflictDto {
  from: string;
  to: string;
}

export interface RoomAvailabilityResponseDto {
  roomId: string;
  date: string;
  available: boolean;
  conflicts: RoomConflictDto[];
}

export interface RoomResponseDto {
  id: string;
  roomNumber: string;
  name: string | null;
  capacity: number;
  type: RoomType;
  floor: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequestDto {
  roomNumber: string;
  name?: string;
  capacity?: number;
  type?: RoomType;
  floor?: number;
  isActive?: boolean;
}

export interface UpdateRoomRequestDto {
  roomNumber?: string;
  name?: string;
  capacity?: number;
  type?: RoomType;
  floor?: number;
  isActive?: boolean;
}
