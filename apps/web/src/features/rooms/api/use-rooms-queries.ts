import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRoomRequestDto } from '@nis/shared';
import { roomsApi, type RoomsFilterParams } from './rooms-api';

export const roomsKeys = {
  all: ['rooms'] as const,
  list: (params?: RoomsFilterParams) => [...roomsKeys.all, 'list', params] as const,
  detail: (id: string) => [...roomsKeys.all, 'detail', id] as const,
};

export function useRoomsQuery(params?: RoomsFilterParams) {
  return useQuery({
    queryKey: roomsKeys.list(params),
    queryFn: () => roomsApi.list(params),
  });
}

export function useCreateRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateRoomRequestDto) => roomsApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}

export function useDeleteRoomMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}
