import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { AuditLogResponseDto, AuditQueryDto, PaginatedResponse } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { auditApi } from './audit-api';

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (query?: AuditQueryDto) => [...auditKeys.all, 'list', query] as const,
};

export function useAuditLogsQuery(query: AuditQueryDto = {}) {
  return useQuery<PaginatedResponse<AuditLogResponseDto>, ApiError>({
    queryKey: auditKeys.list(query),
    queryFn: () => auditApi.list(query),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
