import type { ChangePasswordRequestDto, TelegramLinkCodeResponseDto } from '@nis/shared';
import { api } from '@/lib/api';

export const profileApi = {
  changePassword: (body: ChangePasswordRequestDto): Promise<void> =>
    api.post<void>('/auth/change-password', body).then(() => undefined),

  generateTelegramLinkCode: (): Promise<TelegramLinkCodeResponseDto> =>
    api.post<TelegramLinkCodeResponseDto>('/telegram/link-code').then((r) => r.data),
};
