import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BranchDto, CreateBranchDto, UpdateBranchDto } from '@nis/shared';
import { api } from '@/lib/api';

export const branchesKeys = {
  all: ['branches'] as const,
  list: (onlyActive?: boolean) => [...branchesKeys.all, 'list', { onlyActive }] as const,
  detail: (id: string) => [...branchesKeys.all, 'detail', id] as const,
  stats: (id: string) => [...branchesKeys.all, 'stats', id] as const,
};

export function useBranchesQuery(onlyActive = false) {
  return useQuery({
    queryKey: branchesKeys.list(onlyActive),
    queryFn: async (): Promise<BranchDto[]> => {
      const res = await api.get<BranchDto[]>('/branches', {
        params: onlyActive ? { onlyActive: true } : undefined,
      });
      return res.data;
    },
  });
}

export function useCreateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: CreateBranchDto): Promise<BranchDto> => {
      const res = await api.post<BranchDto>('/branches', dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
}

export function useUpdateBranchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateBranchDto }): Promise<BranchDto> => {
      const res = await api.patch<BranchDto>(`/branches/${id}`, dto);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchesKeys.all });
    },
  });
}
