import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ArchiveStudentRequestDto, StudentResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { studentsApi } from './students-api';
import { studentsKeys } from './keys';

interface ArchiveArgs {
  id: string;
  body: ArchiveStudentRequestDto;
}

export function useArchiveStudentMutation() {
  const qc = useQueryClient();
  return useMutation<StudentResponseDto, ApiError, ArchiveArgs>({
    mutationFn: ({ id, body }) => studentsApi.archive(id, body),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: studentsKeys.lists() });
      void qc.invalidateQueries({ queryKey: studentsKeys.detail(id) });
    },
  });
}
