import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AssignTeacherRequestDto, ClassResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { classesApi } from './classes-api';
import { classesKeys } from './keys';

export function useAssignTeacherMutation(classId: string) {
  const qc = useQueryClient();
  return useMutation<ClassResponseDto, ApiError, AssignTeacherRequestDto>({
    mutationFn: (body) => classesApi.assignTeacher(classId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: classesKeys.lists() });
      void qc.invalidateQueries({ queryKey: classesKeys.detail(classId) });
    },
  });
}
