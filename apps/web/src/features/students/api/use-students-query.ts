import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PaginatedResponse, StudentResponseDto, StudentsListQueryDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { studentsApi } from './students-api';
import { studentsKeys } from './keys';

export function useStudentsQuery(query: StudentsListQueryDto) {
  return useQuery<PaginatedResponse<StudentResponseDto>, ApiError>({
    queryKey: studentsKeys.list(query),
    queryFn: () => studentsApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
