import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ConvertToStudentRequestDto,
  CreateLeadRequestDto,
  UpdateLeadStageRequestDto,
} from '@nis/shared';
import { leadsApi, type LeadsFilterParams } from './leads-api';

export const leadsKeys = {
  all: ['leads'] as const,
  list: (params?: LeadsFilterParams) => [...leadsKeys.all, 'list', params] as const,
  stats: () => [...leadsKeys.all, 'stats'] as const,
  detail: (id: string) => [...leadsKeys.all, 'detail', id] as const,
};

export function useLeadsQuery(params?: LeadsFilterParams) {
  return useQuery({
    queryKey: leadsKeys.list(params),
    queryFn: () => leadsApi.list(params),
  });
}

export function useLeadStatsQuery() {
  return useQuery({
    queryKey: leadsKeys.stats(),
    queryFn: () => leadsApi.getStats(),
  });
}

export function useCreateLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLeadRequestDto) => leadsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useUpdateLeadStageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateLeadStageRequestDto }) =>
      leadsApi.updateStage(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}

export function useConvertToStudentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: ConvertToStudentRequestDto }) =>
      leadsApi.convertToStudent(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteLeadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leadsKeys.all });
    },
  });
}
