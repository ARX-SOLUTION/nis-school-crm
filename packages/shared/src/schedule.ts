export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const SUBSTITUTION_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;
export type SubstitutionStatus = (typeof SUBSTITUTION_STATUSES)[number];

export interface ScheduleEntryResponseDto {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId: string;
  dayOfWeek: DayOfWeek;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSubstitutionResponseDto {
  id: string;
  originalEntryId: string;
  substituteTeacherId: string;
  date: string;
  reason: string | null;
  status: SubstitutionStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
