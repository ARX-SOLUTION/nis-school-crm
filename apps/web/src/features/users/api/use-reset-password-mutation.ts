import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResetPasswordResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { usersApi } from './users-api';
import { usersKeys } from './keys';

export function useResetPasswordMutation() {
  const qc = useQueryClient();
  return useMutation<ResetPasswordResponseDto, ApiError, string>({
    mutationFn: (id) => usersApi.resetPassword(id),
    onSuccess: (_data, id) => {
      // mustChangePassword flips to true and any session revocations are
      // audit-visible; invalidate both the list and the specific row.
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
      void qc.invalidateQueries({ queryKey: usersKeys.detail(id) });
    },
  });
}
