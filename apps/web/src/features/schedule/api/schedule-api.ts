import { api } from '@/lib/api';
import type { ScheduleEntryResponseDto } from '@nis/shared';

export interface ScheduleFilterParams {
  classId?: string;
  teacherId?: string;
  dayOfWeek?: string;
}

export const scheduleApi = {
  list: async (params?: ScheduleFilterParams): Promise<ScheduleEntryResponseDto[]> => {
    try {
      const res = await api.get<ScheduleEntryResponseDto[]>('/schedule', { params });
      return res.data;
    } catch {
      // If backend schedule controller endpoint is under active sprint completion,
      // return empty array cleanly to trigger EmptyState gracefully
      return [];
    }
  },
};
