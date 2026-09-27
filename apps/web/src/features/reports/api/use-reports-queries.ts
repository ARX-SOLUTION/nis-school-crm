import { useQuery } from '@tanstack/react-query';
import { reportsApi } from './reports-api';

export const reportKeys = {
  all: ['reports'] as const,
  attendance: (month?: string, classId?: string) =>
    [...reportKeys.all, 'attendance', month, classId] as const,
  grades: (classId?: string, subjectId?: string) =>
    [...reportKeys.all, 'grades', classId, subjectId] as const,
  finance: (months?: number) => [...reportKeys.all, 'finance', months] as const,
};

export function useAttendanceReportQuery(month?: string, classId?: string) {
  return useQuery({
    queryKey: reportKeys.attendance(month, classId),
    queryFn: () => reportsApi.attendance({ month, classId }),
  });
}

export function useGradesReportQuery(classId?: string, subjectId?: string) {
  return useQuery({
    queryKey: reportKeys.grades(classId, subjectId),
    queryFn: () => reportsApi.grades({ classId, subjectId }),
  });
}

export function useFinanceReportQuery(months = 6) {
  return useQuery({
    queryKey: reportKeys.finance(months),
    queryFn: () => reportsApi.finance({ months }),
  });
}
