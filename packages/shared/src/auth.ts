import type { RoleName } from './roles';

export interface UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: RoleName;
  telegramUsername: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;
}

export interface ChangePasswordRequestDto {
  oldPassword: string;
  newPassword: string;
}
