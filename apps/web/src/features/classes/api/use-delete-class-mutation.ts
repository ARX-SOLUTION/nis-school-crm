import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/lib/api';
import { classesApi } from './classes-api';
import { classesKeys } from './keys';

export function useDeleteClassMutation() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => classesApi.remove(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: classesKeys.lists() });
      qc.removeQueries({ queryKey: classesKeys.detail(id) });
    },
  });
}
