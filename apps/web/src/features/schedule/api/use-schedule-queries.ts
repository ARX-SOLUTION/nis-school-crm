import { useQuery } from '@tanstack/react-query';
import { scheduleApi, type ScheduleFilterParams } from './schedule-api';

export const scheduleKeys = {
  all: ['schedule'] as const,
  list: (params?: ScheduleFilterParams) => [...scheduleKeys.all, 'list', params] as const,
};

export function useScheduleQuery(params?: ScheduleFilterParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: scheduleKeys.list(params),
    queryFn: () => scheduleApi.list(params),
    enabled: options?.enabled ?? true,
  });
}
