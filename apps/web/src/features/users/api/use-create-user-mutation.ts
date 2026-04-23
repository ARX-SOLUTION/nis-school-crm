import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateUserRequestDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { usersApi, type CreateUserApiResponse } from './users-api';
import { usersKeys } from './keys';

export function useCreateUserMutation() {
  const qc = useQueryClient();
  return useMutation<CreateUserApiResponse, ApiError, CreateUserRequestDto>({
    mutationFn: usersApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
