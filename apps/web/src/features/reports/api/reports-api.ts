import { api } from '@/lib/api';
import type {
  ClassAttendanceReportDto,
  FinanceReportDto,
  SubjectGradeReportDto,
  TopStudentDto,
} from '@nis/shared';

export interface GradesReportResponse {
  subjects: SubjectGradeReportDto[];
  topStudents: TopStudentDto[];
}

export const reportsApi = {
  attendance: async (params?: {
    month?: string;
    classId?: string;
  }): Promise<ClassAttendanceReportDto[]> => {
    const res = await api.get<ClassAttendanceReportDto[]>('/reports/attendance', { params });
    return res.data;
  },

  grades: async (params?: {
    classId?: string;
    subjectId?: string;
  }): Promise<GradesReportResponse> => {
    const res = await api.get<GradesReportResponse>('/reports/grades', { params });
    return res.data;
  },

  finance: async (params?: { months?: number }): Promise<FinanceReportDto> => {
    const res = await api.get<FinanceReportDto>('/reports/finance', { params });
    return res.data;
  },
};
