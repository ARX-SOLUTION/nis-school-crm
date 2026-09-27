import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSubjectRequestDto } from '@nis/shared';
import { subjectsApi, type SubjectsFilterParams } from './subjects-api';

export const subjectsKeys = {
  all: ['subjects'] as const,
  list: (params?: SubjectsFilterParams) => [...subjectsKeys.all, 'list', params] as const,
  detail: (id: string) => [...subjectsKeys.all, 'detail', id] as const,
};

export function useSubjectsQuery(params?: SubjectsFilterParams) {
  return useQuery({
    queryKey: subjectsKeys.list(params),
    queryFn: () => subjectsApi.list(params),
  });
}

export function useCreateSubjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSubjectRequestDto) => subjectsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}

export function useDeleteSubjectMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subjectsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectsKeys.all });
    },
  });
}
