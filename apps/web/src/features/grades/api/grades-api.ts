import { api } from '@/lib/api';
import type { CreateGradeRequestDto, GradeRecordDto, StudentGradeSummaryDto } from '@nis/shared';

export interface GradesFilterParams {
  classId?: string;
  studentId?: string;
  subjectId?: string;
  date?: string;
}

export const gradesApi = {
  list: async (params?: GradesFilterParams): Promise<GradeRecordDto[]> => {
    const res = await api.get<GradeRecordDto[]>('/grades', { params });
    return res.data;
  },

  recordGrade: async (dto: CreateGradeRequestDto): Promise<GradeRecordDto> => {
    const res = await api.post<GradeRecordDto>('/grades', dto);
    return res.data;
  },

  getSummary: async (classId: string, subjectId: string): Promise<StudentGradeSummaryDto[]> => {
    const res = await api.get<StudentGradeSummaryDto[]>('/grades/summary', {
      params: { classId, subjectId },
    });
    return res.data;
  },
};
