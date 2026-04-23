import type {
  CreateUserRequestDto,
  PaginatedResponse,
  ResetPasswordResponseDto,
  UpdateUserRequestDto,
  UserResponseDto,
  UsersListQueryDto,
} from '@nis/shared';
import { api } from '@/lib/api';

export interface CreateUserApiResponse {
  user: UserResponseDto;
  generatedPassword: string;
  notified: boolean;
}

export const usersApi = {
  list: (query: UsersListQueryDto): Promise<PaginatedResponse<UserResponseDto>> =>
    api.get<PaginatedResponse<UserResponseDto>>('/users', { params: query }).then((r) => r.data),

  get: (id: string): Promise<UserResponseDto> =>
    api.get<UserResponseDto>(`/users/${id}`).then((r) => r.data),

  create: (body: CreateUserRequestDto): Promise<CreateUserApiResponse> =>
    api.post<CreateUserApiResponse>('/users', body).then((r) => r.data),

  update: (id: string, body: UpdateUserRequestDto): Promise<UserResponseDto> =>
    api.patch<UserResponseDto>(`/users/${id}`, body).then((r) => r.data),

  remove: (id: string): Promise<void> => api.delete<void>(`/users/${id}`).then(() => undefined),

  resetPassword: (id: string): Promise<ResetPasswordResponseDto> =>
    api.post<ResetPasswordResponseDto>(`/users/${id}/reset-password`).then((r) => r.data),
};
