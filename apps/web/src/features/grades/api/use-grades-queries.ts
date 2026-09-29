import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateGradeRequestDto } from '@nis/shared';
import { gradesApi, type GradesFilterParams } from './grades-api';

export const gradesKeys = {
  all: ['grades'] as const,
  list: (params?: GradesFilterParams) => [...gradesKeys.all, 'list', params] as const,
  summary: (classId: string, subjectId: string) =>
    [...gradesKeys.all, 'summary', classId, subjectId] as const,
};

export function useGradesQuery(params?: GradesFilterParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: gradesKeys.list(params),
    queryFn: () => gradesApi.list(params),
    enabled: options?.enabled ?? true,
  });
}

export function useGradesSummaryQuery(
  classId: string,
  subjectId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: gradesKeys.summary(classId, subjectId),
    queryFn: () => gradesApi.getSummary(classId, subjectId),
    enabled: options?.enabled ?? Boolean(classId && subjectId),
  });
}

export function useRecordGradeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGradeRequestDto) => gradesApi.recordGrade(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradesKeys.all });
    },
  });
}
