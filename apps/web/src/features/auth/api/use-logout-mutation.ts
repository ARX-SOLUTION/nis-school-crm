import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStore } from '@/lib/token-store';
import { authApi } from './auth-api';

export function useLogoutMutation() {
  const qc = useQueryClient();
  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      const refresh = tokenStore.getRefresh();
      if (refresh) {
        await authApi.logout(refresh).catch(() => undefined);
      }
    },
    onSettled: () => {
      tokenStore.clear();
      qc.clear();
    },
  });
}
