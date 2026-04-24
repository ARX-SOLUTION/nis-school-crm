import type {
  AcceptParentInviteRequestDto,
  LoginResponseDto,
  TelegramAuthRequestDto,
} from '@nis/shared';
import { api } from '@/lib/api';

export const telegramAuthApi = {
  telegramLogin: (body: TelegramAuthRequestDto): Promise<LoginResponseDto> =>
    api.post<LoginResponseDto>('/auth/telegram', body).then((r) => r.data),

  acceptParentInvite: (body: AcceptParentInviteRequestDto): Promise<LoginResponseDto> =>
    api.post<LoginResponseDto>('/auth/parent/accept-invite', body).then((r) => r.data),
};
