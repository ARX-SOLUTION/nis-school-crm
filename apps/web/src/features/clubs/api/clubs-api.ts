import { api } from '@/lib/api';
import type {
  ClubCategory,
  ClubDto,
  ClubEnrollmentDto,
  ClubFeeType,
  ClubStatus,
  ClubAttendanceRecordDto,
  ClubStatsDto,
  CreateClubPayload,
  EnrollStudentPayload,
  RecordClubAttendancePayload,
  UpdateClubPayload,
} from '@nis/shared';

export interface ClubsFilterParams {
  category?: ClubCategory;
  status?: ClubStatus;
  feeType?: ClubFeeType;
  branchId?: string;
  search?: string;
}

export const clubsApi = {
  list: async (params?: ClubsFilterParams): Promise<ClubDto[]> => {
    const res = await api.get<ClubDto[]>('/clubs', { params });
    return res.data;
  },

  getStats: async (): Promise<ClubStatsDto> => {
    const res = await api.get<ClubStatsDto>('/clubs/stats');
    return res.data;
  },

  getById: async (id: string): Promise<ClubDto> => {
    const res = await api.get<ClubDto>(`/clubs/${id}`);
    return res.data;
  },

  create: async (payload: CreateClubPayload): Promise<ClubDto> => {
    const res = await api.post<ClubDto>('/clubs', payload);
    return res.data;
  },

  update: async (id: string, payload: UpdateClubPayload): Promise<ClubDto> => {
    const res = await api.patch<ClubDto>(`/clubs/${id}`, payload);
    return res.data;
  },

  archive: async (id: string): Promise<void> => {
    await api.delete(`/clubs/${id}`);
  },

  enrollStudent: async (
    clubId: string,
    payload: EnrollStudentPayload,
  ): Promise<ClubEnrollmentDto> => {
    const res = await api.post<ClubEnrollmentDto>(`/clubs/${clubId}/enroll`, payload);
    return res.data;
  },

  dropStudent: async (clubId: string, studentId: string): Promise<ClubEnrollmentDto> => {
    const res = await api.delete<ClubEnrollmentDto>(`/clubs/${clubId}/enroll/${studentId}`);
    return res.data;
  },

  recordAttendance: async (
    clubId: string,
    payload: RecordClubAttendancePayload,
  ): Promise<ClubAttendanceRecordDto[]> => {
    const res = await api.post<ClubAttendanceRecordDto[]>(`/clubs/${clubId}/attendance`, payload);
    return res.data;
  },

  getAttendance: async (clubId: string, date?: string): Promise<ClubAttendanceRecordDto[]> => {
    const res = await api.get<ClubAttendanceRecordDto[]>(`/clubs/${clubId}/attendance`, {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  checkConflict: async (
    roomId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeClubId?: string,
  ): Promise<{ hasConflict: boolean; message?: string }> => {
    const res = await api.get<{ hasConflict: boolean; message?: string }>(
      '/clubs/conflicts/check',
      {
        params: { roomId, dayOfWeek, startTime, endTime, excludeClubId },
      },
    );
    return res.data;
  },
};
