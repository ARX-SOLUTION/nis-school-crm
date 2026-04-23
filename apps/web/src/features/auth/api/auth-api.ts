import type {
  ChangePasswordRequestDto,
  LoginRequestDto,
  LoginResponseDto,
  UserResponseDto,
} from '@nis/shared';
import { api, skipRefresh } from '@/lib/api';

export const authApi = {
  login: (body: LoginRequestDto): Promise<LoginResponseDto> =>
    api.post<LoginResponseDto>('/auth/login', body, skipRefresh({})).then((r) => r.data),

  me: (): Promise<UserResponseDto> => api.get<UserResponseDto>('/auth/me').then((r) => r.data),

  logout: (refreshToken: string): Promise<void> =>
    api.post<void>('/auth/logout', { refreshToken }).then(() => undefined),

  changePassword: (body: ChangePasswordRequestDto): Promise<void> =>
    api.post<void>('/auth/change-password', body).then(() => undefined),
};
