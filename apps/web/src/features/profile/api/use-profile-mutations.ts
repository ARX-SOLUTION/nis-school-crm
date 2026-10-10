import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ChangePasswordRequestDto,
  TelegramLinkCodeResponseDto,
  UserResponseDto,
} from '@nis/shared';
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

export function useUpdateNotificationPrefsMutation() {
  const qc = useQueryClient();
  return useMutation<UserResponseDto, ApiError, Record<string, boolean>>({
    mutationFn: (prefs) => profileApi.updateNotificationPrefs(prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
