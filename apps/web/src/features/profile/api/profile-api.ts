import type {
  ChangePasswordRequestDto,
  TelegramLinkCodeResponseDto,
  UserResponseDto,
} from '@nis/shared';
import { api } from '@/lib/api';

export const profileApi = {
  changePassword: (body: ChangePasswordRequestDto): Promise<void> =>
    api.post<void>('/auth/change-password', body).then(() => undefined),

  generateTelegramLinkCode: (): Promise<TelegramLinkCodeResponseDto> =>
    api.post<TelegramLinkCodeResponseDto>('/telegram/link-code').then((r) => r.data),

  updateNotificationPrefs: (prefs: Record<string, boolean>): Promise<UserResponseDto> =>
    api.patch<UserResponseDto>('/auth/me/prefs', prefs).then((r) => r.data),
};
