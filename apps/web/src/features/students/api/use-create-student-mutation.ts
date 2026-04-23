import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateStudentRequestDto, StudentResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { studentsApi } from './students-api';
import { studentsKeys } from './keys';

export function useCreateStudentMutation() {
  const qc = useQueryClient();
  return useMutation<StudentResponseDto, ApiError, CreateStudentRequestDto>({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentsKeys.lists() });
    },
  });
}
