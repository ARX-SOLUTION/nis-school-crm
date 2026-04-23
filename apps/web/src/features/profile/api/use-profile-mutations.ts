import { useMutation } from '@tanstack/react-query';
import type { ChangePasswordRequestDto, TelegramLinkCodeResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { profileApi } from './profile-api';

export function useChangePasswordMutation() {
  return useMutation<void, ApiError, ChangePasswordRequestDto>({
    mutationFn: profileApi.changePassword,
  });
}

export function useGenerateLinkCodeMutation() {
  return useMutation<TelegramLinkCodeResponseDto, ApiError, void>({
    mutationFn: profileApi.generateTelegramLinkCode,
  });
}
