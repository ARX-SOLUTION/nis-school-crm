import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ClassResponseDto, CreateClassRequestDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { classesApi } from './classes-api';
import { classesKeys } from './keys';

export function useCreateClassMutation() {
  const qc = useQueryClient();
  return useMutation<ClassResponseDto, ApiError, CreateClassRequestDto>({
    mutationFn: classesApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: classesKeys.lists() });
    },
  });
}
