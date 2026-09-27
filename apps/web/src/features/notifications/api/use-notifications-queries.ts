import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SendBroadcastRequestDto } from '@nis/shared';
import { notificationsApi } from './notifications-api';

export const notificationKeys = {
  all: ['notifications'] as const,
  logs: (limit?: number) => [...notificationKeys.all, 'logs', limit] as const,
};

export function useNotificationLogsQuery(limit = 50) {
  return useQuery({
    queryKey: notificationKeys.logs(limit),
    queryFn: () => notificationsApi.getLogs(limit),
  });
}

export function useSendBroadcastMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: SendBroadcastRequestDto) => notificationsApi.sendBroadcast(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
