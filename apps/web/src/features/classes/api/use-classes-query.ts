import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { ClassResponseDto, ClassesListQueryDto, PaginatedResponse } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { classesApi } from './classes-api';
import { classesKeys } from './keys';

export function useClassesQuery(query: ClassesListQueryDto) {
  return useQuery<PaginatedResponse<ClassResponseDto>, ApiError>({
    queryKey: classesKeys.list(query),
    queryFn: () => classesApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
