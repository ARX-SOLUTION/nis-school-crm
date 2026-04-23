import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AssignClassRequestDto, StudentResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { studentsApi } from './students-api';
import { studentsKeys } from './keys';

export function useAssignClassMutation(studentId: string) {
  const qc = useQueryClient();
  return useMutation<StudentResponseDto, ApiError, AssignClassRequestDto>({
    mutationFn: (body) => studentsApi.assignClass(studentId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: studentsKeys.lists() });
      void qc.invalidateQueries({ queryKey: studentsKeys.detail(studentId) });
      void qc.invalidateQueries({ queryKey: studentsKeys.history(studentId) });
    },
  });
}
