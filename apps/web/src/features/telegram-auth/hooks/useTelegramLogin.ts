import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import type { LoginResponseDto, TelegramAuthRequestDto } from '@nis/shared';
import { tokenStore } from '@/lib/token-store';
import { authKeys } from '@/features/auth/api/keys';
import type { ApiError } from '@/lib/api';
import { telegramAuthApi } from '../api/telegram-auth.api';

export function useTelegramLogin() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LoginResponseDto, ApiError, TelegramAuthRequestDto>({
    mutationFn: telegramAuthApi.telegramLogin,
    onSuccess: async (data) => {
      tokenStore.setTokens(data.accessToken, data.refreshToken);
      qc.setQueryData(authKeys.me(), data.user);
      await navigate({ to: '/' });
    },
  });
}
