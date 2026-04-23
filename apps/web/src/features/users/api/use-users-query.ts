import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { PaginatedResponse, UserResponseDto, UsersListQueryDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { usersApi } from './users-api';
import { usersKeys } from './keys';

export function useUsersQuery(query: UsersListQueryDto) {
  return useQuery<PaginatedResponse<UserResponseDto>, ApiError>({
    queryKey: usersKeys.list(query),
    queryFn: () => usersApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
