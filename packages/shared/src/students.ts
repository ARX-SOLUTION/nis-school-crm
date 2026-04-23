export const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'GRADUATED'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_GENDERS = ['MALE', 'FEMALE'] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export interface StudentResponseDto {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  birthDate: string;
  gender: StudentGender | null;
  gradeLevel: number;
  classId: string | null;
  status: StudentStatus;
  parentFullName: string | null;
  parentPhone: string | null;
  parentTelegram: string | null;
  enrolledAt: string;
  leftAt: string | null;
  leftReason: string | null;
  createdAt: string;
}

export interface CreateStudentRequestDto {
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate: string;
  gender?: StudentGender;
  gradeLevel: number;
  classId?: string;
  parentFullName?: string;
  parentPhone?: string;
  parentTelegram?: string;
  address?: string;
  bloodGroup?: string;
  medicalNotes?: string;
}

export interface UpdateStudentRequestDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  birthDate?: string;
  gender?: StudentGender;
  gradeLevel?: number;
  parentFullName?: string;
  parentPhone?: string;
  parentTelegram?: string;
  address?: string;
  bloodGroup?: string;
  medicalNotes?: string;
}

export interface StudentsListQueryDto {
  page?: number;
  limit?: number;
  classId?: string;
  status?: StudentStatus;
  gradeLevel?: number;
  search?: string;
}

export interface AssignClassRequestDto {
  classId: string;
  reason?: string;
}

export interface ArchiveStudentRequestDto {
  reason: string;
  note?: string;
}
