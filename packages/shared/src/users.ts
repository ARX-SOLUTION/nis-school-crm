import type { RoleName } from './roles';
import type { UserResponseDto } from './auth';

export interface CreateUserRequestDto {
  email: string;
  fullName: string;
  role: RoleName;
  phone?: string;
  telegramUsername?: string;
}

export interface UpdateUserRequestDto {
  fullName?: string;
  phone?: string;
  telegramUsername?: string;
  isActive?: boolean;
}

export interface UsersListQueryDto {
  page?: number;
  limit?: number;
  role?: RoleName;
  search?: string;
  isActive?: boolean;
}

export interface ResetPasswordResponseDto {
  notified: boolean;
  generatedPassword: string;
}

export interface CreateTeacherRequestDto {
  email: string;
  fullName: string;
  phone?: string;
  telegramUsername?: string;
  subject?: string;
  experienceYears?: number;
  education?: string;
}

export interface TeacherResponseDto {
  user: UserResponseDto;
  subject: string | null;
  experienceYears: number;
  education: string | null;
  bio: string | null;
}
