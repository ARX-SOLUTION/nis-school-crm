import { api } from '@/lib/api';
import type {
  AttendanceRecordDto,
  AttendanceStatsDto,
  BulkAttendanceRequestDto,
} from '@nis/shared';

export interface AttendanceFilterParams {
  classId?: string;
  studentId?: string;
  date?: string;
}

export const attendanceApi = {
  list: async (params?: AttendanceFilterParams): Promise<AttendanceRecordDto[]> => {
    const res = await api.get<AttendanceRecordDto[]>('/attendance', { params });
    return res.data;
  },

  bulkRecord: async (dto: BulkAttendanceRequestDto): Promise<AttendanceRecordDto[]> => {
    const res = await api.post<AttendanceRecordDto[]>('/attendance/bulk', dto);
    return res.data;
  },

  getStats: async (studentId: string): Promise<AttendanceStatsDto> => {
    const res = await api.get<AttendanceStatsDto>(`/attendance/stats/${studentId}`);
    return res.data;
  },
};
