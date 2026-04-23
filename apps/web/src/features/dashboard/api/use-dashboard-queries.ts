import { useQuery } from '@tanstack/react-query';
import type { AuditLogResponseDto, DashboardStatsResponseDto } from '@nis/shared';
import type { ApiError } from '@/lib/api';
import { dashboardApi } from './dashboard-api';

export function useDashboardStatsQuery() {
  return useQuery<DashboardStatsResponseDto, ApiError>({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardApi.stats,
    staleTime: 30_000,
  });
}

export function useRecentActivityQuery(enabled: boolean) {
  return useQuery<AuditLogResponseDto[], ApiError>({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: dashboardApi.recentActivity,
    enabled,
    staleTime: 30_000,
  });
}
