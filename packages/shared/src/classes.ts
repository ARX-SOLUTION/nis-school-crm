export interface ClassResponseDto {
  id: string;
  name: string;
  gradeLevel: number;
  academicYear: string;
  maxStudents: number;
  roomNumber: string | null;
  classTeacherId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateClassRequestDto {
  name: string;
  gradeLevel: number;
  academicYear: string;
  maxStudents?: number;
  roomNumber?: string;
  classTeacherId?: string;
  isActive?: boolean;
}

export interface UpdateClassRequestDto {
  name?: string;
  maxStudents?: number;
  roomNumber?: string;
  isActive?: boolean;
}

export interface ClassesListQueryDto {
  page?: number;
  limit?: number;
  gradeLevel?: number;
  academicYear?: string;
}

export interface AssignTeacherRequestDto {
  teacherId: string;
}
