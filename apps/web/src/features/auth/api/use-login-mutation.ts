import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { LoginRequestDto, LoginResponseDto } from '@nis/shared';
import { tokenStore } from '@/lib/token-store';
import type { ApiError } from '@/lib/api';
import { authApi } from './auth-api';
import { authKeys } from './keys';

export function useLoginMutation() {
  const qc = useQueryClient();
  return useMutation<LoginResponseDto, ApiError, LoginRequestDto>({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenStore.setTokens(data.accessToken, data.refreshToken);
      qc.setQueryData(authKeys.me(), data.user);
    },
  });
}
