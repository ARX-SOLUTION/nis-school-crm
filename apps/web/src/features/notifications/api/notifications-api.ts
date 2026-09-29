import { api } from '@/lib/api';
import type { NotificationLogDto, SendBroadcastRequestDto } from '@nis/shared';

export const notificationsApi = {
  getLogs: async (limit = 50): Promise<NotificationLogDto[]> => {
    const res = await api.get<NotificationLogDto[]>('/notifications/logs', {
      params: { limit },
    });
    return res.data;
  },

  sendBroadcast: async (dto: SendBroadcastRequestDto): Promise<NotificationLogDto> => {
    const res = await api.post<NotificationLogDto>('/notifications/broadcast', dto);
    return res.data;
  },
};
