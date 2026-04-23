import type { AuditLogResponseDto, DashboardStatsResponseDto } from '@nis/shared';
import { api } from '@/lib/api';

export const dashboardApi = {
  stats: (): Promise<DashboardStatsResponseDto> =>
    api.get<DashboardStatsResponseDto>('/dashboard/stats').then((r) => r.data),

  recentActivity: (): Promise<AuditLogResponseDto[]> =>
    api.get<AuditLogResponseDto[]>('/dashboard/recent-activity').then((r) => r.data),
};
