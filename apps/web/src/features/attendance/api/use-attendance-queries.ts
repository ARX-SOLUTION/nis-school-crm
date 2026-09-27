import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkAttendanceRequestDto } from '@nis/shared';
import { attendanceApi, type AttendanceFilterParams } from './attendance-api';

export const attendanceKeys = {
  all: ['attendance'] as const,
  list: (params?: AttendanceFilterParams) => [...attendanceKeys.all, 'list', params] as const,
  stats: (studentId: string) => [...attendanceKeys.all, 'stats', studentId] as const,
};

export function useAttendanceQuery(
  params?: AttendanceFilterParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: attendanceKeys.list(params),
    queryFn: () => attendanceApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useBulkAttendanceMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkAttendanceRequestDto) => attendanceApi.bulkRecord(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
  });
}
