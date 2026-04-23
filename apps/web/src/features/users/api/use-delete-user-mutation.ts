import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { usersApi } from './users-api';
import { usersKeys } from './keys';

export function useDeleteUserMutation() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => usersApi.remove(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: usersKeys.lists() });
      qc.removeQueries({ queryKey: usersKeys.detail(id) });
    },
  });
}
